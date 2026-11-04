const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'],
    required: true
  },
  changedAt: { type: Date, required: true, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String, default: 'Fulfillment Center' },
  note: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String },
      qty: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  address: {
    fullName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  paymentAmountPaise: { type: Number },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refund Pending', 'Refunded', 'Refund Required'],
    default: 'Pending'
  },
  paymentMethod: { type: String, default: 'Razorpay Gateway' },
  paymentFailureReason: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'],
    default: 'Placed'
  },
  statusHistory: { type: [orderStatusHistorySchema], default: [] },
  trackingNumber: { type: String },
  carrier: { type: String, default: 'Basketry Express Logistics' },
  estimatedDelivery: { type: Date },
  dispatchHub: { type: String, default: 'Central Fulfillment Facility, Bangalore' },
  invoiceNumber: { type: String }
}, { timestamps: true });

// Auto-generate invoice and tracking numbers if absent
orderSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    this.invoiceNumber = `INV-${year}-${rand}`;
  }
  if (!this.trackingNumber && ['Shipped', 'Out for Delivery', 'Delivered'].includes(this.status)) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    this.trackingNumber = `BSK-TRK-${rand}`;
  }
  if (!this.estimatedDelivery) {
    const est = new Date();
    est.setDate(est.getDate() + 4);
    this.estimatedDelivery = est;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
