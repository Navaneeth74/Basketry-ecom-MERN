const Order = require('../models/Order');
const Product = require('../models/Product');
const { ORDER_STATUSES, isValidOrderStatusTransition } = require('../utils/orderStatus');
const sendEmail = require('../utils/sendEmail');

const addOrderItems = async (req, res) => {
  try {
    const { paymentId } = req.body || {};
    if (!paymentId) {
      return res.status(400).json({ message: 'A verified payment is required to retrieve an order' });
    }

    const order = await Order.findOne({
      userId: req.user._id,
      paymentId,
      paymentStatus: 'Paid'
    }).populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: 'No paid order exists for this payment' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { trackingNumber: searchRegex },
        { invoiceNumber: searchRegex },
        { 'address.fullName': searchRegex },
        { 'address.city': searchRegex }
      ];
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        filter.$or.push({ _id: search });
      }
    }

    const orders = await Order.find(filter)
      .populate('userId', 'id name email')
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Public or Customer order tracking by Order ID or Tracking Number
// @route GET /api/orders/track/:identifier
const trackOrderPublic = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier && identifier.match(/^[0-9a-fA-F]{24}$/);

    const order = await Order.findOne({
      $or: [
        { trackingNumber: identifier },
        { invoiceNumber: identifier },
        ...(isObjectId ? [{ _id: identifier }] : [])
      ]
    }).populate('items.productId', 'name imageUrl price category');

    if (!order) {
      return res.status(404).json({ message: 'No shipment found with the provided Order ID or Tracking Number' });
    }

    // Mask sensitive details for public tracking query
    const publicData = {
      orderId: order._id,
      trackingNumber: order.trackingNumber || `BSK-TRK-${order._id.toString().substring(0, 6).toUpperCase()}`,
      carrier: order.carrier || 'Basketry Express Logistics',
      status: order.status || 'Placed',
      estimatedDelivery: order.estimatedDelivery,
      dispatchHub: order.dispatchHub,
      createdAt: order.createdAt,
      statusHistory: order.statusHistory,
      invoiceNumber: order.invoiceNumber,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((acc, i) => acc + (i.qty || 1), 0),
      items: order.items.map(i => ({
        name: i.productId?.name || i.name || 'Basketry Item',
        qty: i.qty,
        price: i.price,
        imageUrl: i.productId?.imageUrl
      })),
      destinationCity: order.address?.city,
      destinationCountry: order.address?.country
    };

    res.json(publicData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { status, carrier, trackingNumber, location, note } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Choose a valid order status' });
    }
    if (status === order.status) {
      return res.json(order);
    }
    if (!isValidOrderStatusTransition(order.status, status)) {
      return res.status(409).json({
        message: `Order cannot move from ${order.status} to ${status}`
      });
    }
    if (order.razorpayOrderId && order.paymentStatus !== 'Paid') {
      return res.status(409).json({ message: 'Only paid orders can enter fulfillment' });
    }

    const changedAt = new Date();
    const historyEvents = [];
    if (order.status === 'Pending' && order.statusHistory.length === 0) {
      historyEvents.push({
        status: 'Placed',
        changedAt: order.createdAt,
        location: 'Order Management Gateway',
        note: 'Initial Order Placed'
      });
    }

    const hubLocation = location || (
      status === 'Processing' ? 'Warehouse Packing Facility' :
      status === 'Shipped' ? 'Logistics Transit Hub' :
      status === 'Out for Delivery' ? 'Local Courier Distribution Hub' :
      status === 'Delivered' ? `${order.address.city} Customer Address` :
      'Central Fulfillment Facility'
    );

    historyEvents.push({
      status,
      changedAt,
      changedBy: req.user._id,
      location: hubLocation,
      note: note || `Order advanced to ${status}`
    });

    const updateFields = {
      status,
      ...(carrier ? { carrier } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(status === 'Shipped' && !order.trackingNumber && !trackingNumber ? {
        trackingNumber: `BSK-TRK-${Math.floor(100000 + Math.random() * 900000)}`
      } : {})
    };

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      {
        $set: updateFields,
        $push: { statusHistory: { $each: historyEvents } }
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email').populate('items.productId');

    if (!updatedOrder) {
      return res.status(409).json({ message: 'Order status changed. Refresh and try again.' });
    }

    // Attempt to notify user via email asynchronously
    if (order.userId && order.userId.email) {
      sendEmail({
        email: order.userId.email,
        subject: `Basketry Order Update: ${status}`,
        message: `
          <h2>Order Status Update</h2>
          <p>Hello ${order.userId.name || 'Valued Customer'},</p>
          <p>Your Basketry order <strong>#${order._id}</strong> has been updated to: <strong>${status}</strong>.</p>
          <p>Location: ${hubLocation}</p>
          ${updatedOrder.trackingNumber ? `<p>Tracking Number: <strong>${updatedOrder.trackingNumber}</strong> (${updatedOrder.carrier})</p>` : ''}
          <p>You can track your package live at any time on the Basketry website.</p>
          <p>Best regards,<br/>Navaneeth S & The Basketry Team</p>
        `
      }).catch(err => console.log('Notification email note:', err.message));
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrders,
  trackOrderPublic,
  updateOrderStatus
};
