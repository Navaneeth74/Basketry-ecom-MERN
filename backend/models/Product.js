const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, uppercase: true, trim: true },
  brand: { type: String, default: 'Basketry Studio', trim: true },
  lowStockThreshold: { type: Number, default: 5, min: 1 },
  imageUrl: { type: String, required: true },
  ratings: { type: Number, default: 4.5, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
  isFeatured: { type: Boolean, default: false },
  source: { type: String, default: 'Internal' },
  externalId: { type: String }
}, { timestamps: true });

// Auto-generate SKU if not provided before save
productSchema.pre('save', function (next) {
  if (!this.sku) {
    const catCode = (this.category || 'GEN').substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.sku = `BSK-${catCode}-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
