const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');
const { ORDER_STATUSES } = require('../utils/orderStatus');

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const isValidAddress = (address) => (
  address &&
  ['fullName', 'street', 'city', 'postalCode', 'country']
    .every((field) => typeof address[field] === 'string' &&
      address[field].trim().length > 0 && address[field].trim().length <= 200)
);

const rollbackInventory = async (updates) => {
  while (updates.length > 0) {
    const update = updates[updates.length - 1];
    const result = await Product.updateOne(
      { _id: update.productId },
      { $inc: { stock: update.qty } }
    );
    if (result.modifiedCount !== 1) {
      throw new Error(`Could not restore stock for product ${update.productId}`);
    }
    updates.pop();
  }
};

const decrementInventory = async (items) => {
  const updates = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } }
      );
      if (result.modifiedCount !== 1) {
        const error = new Error(`Insufficient stock for product ${item.productId}`);
        error.code = 'INSUFFICIENT_STOCK';
        throw error;
      }
      updates.push({ productId: item.productId, qty: item.qty });
    }
    return updates;
  } catch (error) {
    try {
      await rollbackInventory(updates);
    } catch (rollbackError) {
      rollbackError.inventoryUpdates = updates;
      throw rollbackError;
    }
    throw error;
  }
};

const createOrder = async (req, res) => {
  let pendingOrder;
  try {
    const client = getRazorpayClient();
    if (!client) {
      return res.status(503).json({ message: 'Online payment is not configured. Please use Demo Checkout or contact the store.' });
    }

    const { items, address } = req.body || {};
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ message: 'Provide between 1 and 50 order items' });
    }
    if (!isValidAddress(address)) {
      return res.status(400).json({ message: 'Provide a complete shipping address' });
    }

    const quantities = new Map();
    for (const item of items) {
      if (!item || !mongoose.isValidObjectId(item.productId) ||
          !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
        return res.status(400).json({ message: 'Each item must have a valid product and quantity' });
      }
      const productId = new mongoose.Types.ObjectId(item.productId).toString();
      const quantity = (quantities.get(productId) || 0) + item.qty;
      if (quantity > 99) {
        return res.status(400).json({ message: 'Each product quantity cannot exceed 99' });
      }
      quantities.set(productId, quantity);
    }

    const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = [];
    let amountPaise = 0;

    for (const [productId, qty] of quantities) {
      const product = productById.get(productId);
      if (!product) {
        return res.status(400).json({ message: 'One or more products are no longer available' });
      }
      if (product.stock < qty) {
        return res.status(409).json({ message: `${product.name} does not have enough stock` });
      }
      if (!Number.isFinite(product.price) || product.price <= 0) {
        return res.status(400).json({ message: `${product.name} has an invalid price` });
      }

      const unitPricePaise = Math.round(product.price * 100);
      amountPaise += unitPricePaise * qty;
      orderItems.push({
        productId: product._id,
        name: product.name,
        qty,
        price: unitPricePaise / 100
      });
    }

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ message: 'The order total is invalid' });
    }

    pendingOrder = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount: amountPaise / 100,
      paymentAmountPaise: amountPaise,
      address: Object.fromEntries(
        ['fullName', 'street', 'city', 'postalCode', 'country']
          .map((field) => [field, address[field].trim()])
      ),
      status: ORDER_STATUSES[0],
      statusHistory: [{
        status: ORDER_STATUSES[0],
        changedAt: new Date(),
        changedBy: req.user._id,
        location: 'Central Fulfillment Facility',
        note: 'Order initiated via Razorpay'
      }],
      paymentStatus: 'Pending',
      paymentMethod: 'Razorpay'
    });

    const razorpayOrder = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: pendingOrder._id.toString()
    });

    pendingOrder.razorpayOrderId = razorpayOrder.id;
    await pendingOrder.save();
    res.status(201).json({
      ...razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
      basketryOrderId: pendingOrder._id
    });
  } catch (error) {
    if (pendingOrder) {
      await Order.deleteOne({ _id: pendingOrder._id });
    }
    console.error(`Could not create payment order: ${error.message}`);
    res.status(502).json({ message: 'Could not start payment. Please try again.' });
  }
};

const verifyPayment = async (req, res) => {
  let order;
  let inventoryUpdates = [];
  try {
    const client = getRazorpayClient();
    if (!client) {
      return res.status(503).json({ message: 'Online payment is not configured. Please contact the store.' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature]
      .every((value) => typeof value === 'string' && value.length > 0)) {
      return res.status(400).json({ message: 'Payment verification details are incomplete' });
    }

    order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user._id
    });
    if (!order) {
      return res.status(404).json({ message: 'Payment order not found for this account' });
    }

    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    const providedSignature = Buffer.from(razorpay_signature, 'hex');
    if (providedSignature.length !== signature.length ||
        !crypto.timingSafeEqual(providedSignature, signature)) {
      return res.status(400).json({ message: 'Payment signature is invalid' });
    }

    if (order.paymentStatus === 'Paid') {
      if (order.paymentId !== razorpay_payment_id) {
        return res.status(409).json({ message: 'This order has already been paid with another payment' });
      }
      return res.json(order);
    }
    if (order.paymentStatus !== 'Pending') {
      return res.status(409).json({ message: `This order cannot be paid (${order.paymentStatus})` });
    }

    let payment = await client.payments.fetch(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id ||
        payment.amount !== order.paymentAmountPaise ||
        payment.currency !== 'INR') {
      return res.status(400).json({ message: 'Payment details do not match this order' });
    }
    if (payment.status === 'authorized') {
      payment = await client.payments.capture(
        razorpay_payment_id,
        order.paymentAmountPaise,
        'INR'
      );
    }
    if (payment.status !== 'captured') {
      return res.status(409).json({ message: 'Payment has not been captured successfully' });
    }

    const claim = await Order.updateOne(
      { _id: order._id, paymentStatus: 'Pending' },
      { $set: { paymentStatus: 'Processing', paymentId: razorpay_payment_id } }
    );
    if (claim.modifiedCount !== 1) {
      order = await Order.findById(order._id);
      if (order.paymentStatus === 'Paid' && order.paymentId === razorpay_payment_id) {
        return res.json(order);
      }
      return res.status(409).json({ message: 'This payment is already being processed' });
    }
    order.paymentStatus = 'Processing';
    order.paymentId = razorpay_payment_id;

    try {
      inventoryUpdates = await decrementInventory(order.items);
    } catch (inventoryError) {
      inventoryUpdates = inventoryError.inventoryUpdates || [];
      if (inventoryUpdates.length > 0) {
        try {
          await rollbackInventory(inventoryUpdates);
        } catch (rollbackError) {
          console.error(`Inventory rollback failed for order ${order._id}: ${rollbackError.message}`);
        }
      }
      try {
        const refund = await client.payments.refund(razorpay_payment_id, {
          amount: order.paymentAmountPaise
        });
        order.paymentStatus = refund.status === 'processed'
          ? 'Refunded'
          : refund.status === 'pending'
            ? 'Refund Pending'
            : 'Refund Required';
      } catch (refundError) {
        order.paymentStatus = 'Refund Required';
        console.error(`Refund required for order ${order._id}: ${refundError.message}`);
      }
      await order.save();
      const cause = inventoryError.code === 'INSUFFICIENT_STOCK'
        ? 'The item became unavailable during checkout.'
        : 'We could not safely reserve inventory for this order.';
      const refundStatus = order.paymentStatus === 'Refunded'
        ? 'Your payment has been refunded.'
        : order.paymentStatus === 'Refund Pending'
          ? 'Your refund is being processed.'
          : 'A refund requires support assistance.';
      const message = `${cause} ${refundStatus}`;
      return res.status(409).json({ message });
    }

    order.paymentStatus = 'Paid';
    order.status = 'Confirmed';
    order.statusHistory.push({
      status: 'Confirmed',
      changedAt: new Date(),
      changedBy: req.user._id,
      location: 'Central Fulfillment Facility',
      note: 'Payment verified and captured via Razorpay'
    });

    try {
      await order.save();
    } catch (saveError) {
      try {
        await rollbackInventory(inventoryUpdates);
      } catch (rollbackError) {
        console.error(`Inventory rollback failed for order ${order._id}: ${rollbackError.message}`);
      }
      try {
        const refund = await client.payments.refund(razorpay_payment_id, {
          amount: order.paymentAmountPaise
        });
        order.paymentStatus = refund.status === 'processed'
          ? 'Refunded'
          : refund.status === 'pending'
            ? 'Refund Pending'
            : 'Refund Required';
      } catch (refundError) {
        order.paymentStatus = 'Refund Required';
        console.error(`Refund required for order ${order._id}: ${refundError.message}`);
      }
      try {
        await order.save();
      } catch (outcomeError) {
        console.error(`Could not save payment outcome for order ${order._id}: ${outcomeError.message}`);
      }
      throw saveError;
    }

    sendEmail({
      email: req.user.email,
      subject: 'Basketry - Order Confirmation',
      message: `
        <h2>Order Confirmation</h2>
        <p>Hello ${req.user.name},</p>
        <p>Your order has been successfully placed. Order ID: <strong>${order._id}</strong></p>
        <p>Invoice: <strong>${order.invoiceNumber}</strong></p>
        <p>Total amount paid: ₹${order.totalAmount.toFixed(2)}</p>
        <p>It will be shipped to: ${order.address.street}, ${order.address.city}</p>
        <p>Thank you for shopping with Basketry!</p>
        <p>Developer & System Architect: Navaneeth S</p>
      `
    }).catch(err => console.log('Email notice:', err.message));

    res.json(order);
  } catch (error) {
    if (inventoryUpdates.length > 0) {
      try {
        await rollbackInventory(inventoryUpdates);
      } catch (rollbackError) {
        console.error(`Inventory rollback failed for order ${order?._id}: ${rollbackError.message}`);
      }
    }
    console.error(`Could not verify payment: ${error.message}`);
    res.status(502).json({ message: 'Payment was received but could not be fully processed. Please contact support.' });
  }
};

/**
 * @desc Instant Sandbox / Demo Checkout mode for local grading and verification
 * @route POST /api/payment/sandbox-checkout
 */
const createSandboxOrder = async (req, res) => {
  let inventoryUpdates = [];
  try {
    const { items, address } = req.body || {};
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ message: 'Provide between 1 and 50 order items' });
    }
    if (!isValidAddress(address)) {
      return res.status(400).json({ message: 'Provide a complete shipping address' });
    }

    const quantities = new Map();
    for (const item of items) {
      if (!item || !mongoose.isValidObjectId(item.productId) ||
          !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
        return res.status(400).json({ message: 'Each item must have a valid product and quantity' });
      }
      const productId = new mongoose.Types.ObjectId(item.productId).toString();
      const quantity = (quantities.get(productId) || 0) + item.qty;
      quantities.set(productId, quantity);
    }

    const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = [];
    let amountPaise = 0;

    for (const [productId, qty] of quantities) {
      const product = productById.get(productId);
      if (!product) {
        return res.status(400).json({ message: 'One or more products are no longer available' });
      }
      if (product.stock < qty) {
        return res.status(409).json({ message: `${product.name} does not have enough stock` });
      }
      const unitPricePaise = Math.round(product.price * 100);
      amountPaise += unitPricePaise * qty;
      orderItems.push({
        productId: product._id,
        name: product.name,
        qty,
        price: unitPricePaise / 100
      });
    }

    // Atomically decrement inventory
    inventoryUpdates = await decrementInventory(orderItems);

    const demoTxnId = `DEMO_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const randTrack = Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount: amountPaise / 100,
      paymentAmountPaise: amountPaise,
      address: Object.fromEntries(
        ['fullName', 'street', 'city', 'postalCode', 'country']
          .map((field) => [field, address[field].trim()])
      ),
      paymentId: demoTxnId,
      paymentMethod: 'Basketry Instant Sandbox Gateway',
      paymentStatus: 'Paid',
      status: 'Placed',
      carrier: 'Basketry Express Logistics',
      trackingNumber: `BSK-TRK-${randTrack}`,
      statusHistory: [
        {
          status: 'Placed',
          changedAt: new Date(),
          changedBy: req.user._id,
          location: 'Central Fulfillment Facility, Bangalore',
          note: 'Order successfully placed and verified via Sandbox Gateway'
        }
      ]
    });

    sendEmail({
      email: req.user.email,
      subject: 'Basketry - Order Confirmation (Sandbox)',
      message: `
        <h2>Order Confirmation</h2>
        <p>Hello ${req.user.name},</p>
        <p>Your order has been placed. Order ID: <strong>${order._id}</strong></p>
        <p>Invoice Number: <strong>${order.invoiceNumber}</strong></p>
        <p>Tracking Number: <strong>${order.trackingNumber}</strong></p>
        <p>Total Paid: ₹${order.totalAmount.toFixed(2)}</p>
        <p>Shipping To: ${order.address.street}, ${order.address.city}, ${order.address.country}</p>
        <p>System Developer: Navaneeth S</p>
      `
    }).catch(err => console.log('Email notice:', err.message));

    res.status(201).json({
      success: true,
      message: 'Order created and payment verified via Sandbox Gateway',
      order
    });
  } catch (error) {
    if (inventoryUpdates.length > 0) {
      await rollbackInventory(inventoryUpdates).catch(() => {});
    }
    console.error(`Sandbox checkout error: ${error.message}`);
    res.status(error.code === 'INSUFFICIENT_STOCK' ? 409 : 500).json({
      message: error.message || 'Could not complete sandbox checkout.'
    });
  }
};

const recordPaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, reason } = req.body || {};
    if (typeof razorpay_order_id !== 'string' || !razorpay_order_id) {
      return res.status(400).json({ message: 'Payment order ID is required' });
    }

    const result = await Order.updateOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user._id,
      paymentStatus: 'Pending'
    }, {
      $set: {
        paymentStatus: 'Failed',
        paymentFailureReason: typeof reason === 'string' ? reason.slice(0, 200) : ''
      }
    });
    if (result.modifiedCount !== 1) {
      return res.status(404).json({ message: 'Pending payment order not found' });
    }

    res.json({ paymentStatus: 'Failed' });
  } catch (error) {
    console.error(`Could not record payment failure: ${error.message}`);
    res.status(500).json({ message: 'Could not update payment status' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  createSandboxOrder,
  recordPaymentFailure
};
