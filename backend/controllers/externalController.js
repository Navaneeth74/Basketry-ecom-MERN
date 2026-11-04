const https = require('https');
const http = require('http');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Helper for making outbound HTTP/HTTPS requests with timeouts
const fetchExternalJSON = (url, timeoutMs = 4000) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: timeoutMs }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('External API request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * @desc Fetch external products from third-party supplier API for catalog synchronization
 * @route GET /api/external/supplier-catalog
 */
const getSupplierCatalog = async (req, res) => {
  try {
    const externalFeed = await fetchExternalJSON('https://dummyjson.com/products?limit=12', 3500);
    if (externalFeed && Array.isArray(externalFeed.products)) {
      const formatted = externalFeed.products.map(p => ({
        externalId: `EXT-${p.id}`,
        name: p.title,
        description: p.description,
        category: p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'General',
        price: Math.round(p.price * 83), // Normalize supplier USD prices to approximate INR
        stock: p.stock || 25,
        brand: p.brand || 'Global Supplier Partner',
        imageUrl: (p.images && p.images[0]) || p.thumbnail,
        ratings: p.rating || 4.5,
        numReviews: Math.floor(Math.random() * 40) + 5
      }));
      return res.json({ success: true, source: 'dummyjson.com API', products: formatted });
    }
    throw new Error('Failed to load supplier products');
  } catch (err) {
    // Fallback enterprise mock supplier feed
    const mockSupplierProducts = [
      {
        externalId: 'EXT-SUP-101',
        name: 'Handcrafted Nordic Woven Basket',
        description: 'Authentic organic woven storage basket made with eco-friendly jute and cane.',
        category: 'Home Decor',
        price: 1899,
        stock: 35,
        brand: 'Nordic Craftworks',
        imageUrl: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.8,
        numReviews: 29
      },
      {
        externalId: 'EXT-SUP-102',
        name: 'Smart Ceramic Pour-Over Kettle',
        description: 'Precision gooseneck temperature-controlled electric kettle for premium brew.',
        category: 'Kitchenware',
        price: 3499,
        stock: 18,
        brand: 'BrewMaster Pro',
        imageUrl: 'https://images.unsplash.com/photo-1570564259858-69315570be7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.9,
        numReviews: 54
      },
      {
        externalId: 'EXT-SUP-103',
        name: 'Ergonomic Walnut Desk Mat & Organizer',
        description: 'Premium dual-sided desk accessory crafted with sustainably sourced walnut accents.',
        category: 'Furniture',
        price: 2199,
        stock: 40,
        brand: 'Studio Artisan',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.7,
        numReviews: 38
      },
      {
        externalId: 'EXT-SUP-104',
        name: 'Ambient Studio LED Sunset Lamp',
        description: 'Multi-spectrum optical projection light featuring smart remote dimming control.',
        category: 'Electronics',
        price: 1499,
        stock: 22,
        brand: 'Aura Illumination',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.6,
        numReviews: 42
      }
    ];
    return res.json({ success: true, source: 'curated supplier feed', products: mockSupplierProducts });
  }
};

/**
 * @desc Import an external third-party supplier product into the local Basketry database
 * @route POST /api/external/import-product
 * @access Admin
 */
const importSupplierProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl, brand, externalId } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required for import' });
    }

    // Check if already imported
    if (externalId) {
      const existing = await Product.findOne({ externalId });
      if (existing) {
        return res.status(409).json({ message: 'This product has already been imported into the catalog.' });
      }
    }

    const catCode = category.substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const sku = `BSK-${catCode}-EXT${rand}`;

    const newProduct = new Product({
      name,
      description: description || 'High-grade supplier partner merchandise.',
      price: Number(price),
      category,
      stock: Number(stock) || 20,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      brand: brand || 'Global Partner',
      sku,
      lowStockThreshold: 5,
      ratings: 4.8,
      numReviews: 12,
      source: 'ThirdPartySync',
      externalId: externalId || `EXT-${Date.now()}`
    });

    const saved = await newProduct.save();
    res.status(201).json({ message: 'Successfully imported external supplier product', product: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Live Courier Telemetry & Package Tracking Simulator
 * @route GET /api/external/track-courier/:trackingNumber
 */
const getCarrierTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const order = await Order.findOne({
      $or: [
        { trackingNumber },
        { _id: trackingNumber.match(/^[0-9a-fA-F]{24}$/) ? trackingNumber : null }
      ]
    }).populate('userId', 'name email');

    const status = order ? order.status : 'In Transit';

    // Simulated logistics hubs
    const checkpoints = [
      { hub: 'Central Fulfillment Facility, Bangalore', time: 'Day 1 - 09:30 AM', event: 'Order Picked & Packaging Complete', done: true },
      { hub: 'Regional Sorting Facility, Mumbai', time: 'Day 2 - 04:15 PM', event: 'Arrived at Sort Hub & Security Scanned', done: ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) },
      { hub: 'Interstate Cargo Hub', time: 'Day 3 - 07:00 AM', event: 'Linehaul Transit in Progress', done: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) },
      { hub: 'Destination Delivery Station', time: 'Day 3 - 08:45 PM', event: 'Arrived at Local Distribution Center', done: ['Shipped', 'Out for Delivery', 'Delivered'].includes(status) },
      { hub: 'Last Mile Dispatch Vehicle #BSK-42', time: 'Day 4 - 09:15 AM', event: 'Courier Agent Out for Delivery', done: ['Out for Delivery', 'Delivered'].includes(status) },
      { hub: 'Customer Doorstep', time: 'Day 4 - 02:30 PM', event: 'Package Successfully Handed Over & Verified', done: status === 'Delivered' }
    ];

    res.json({
      success: true,
      carrier: order?.carrier || 'Basketry Express Logistics',
      trackingNumber: order?.trackingNumber || trackingNumber,
      orderId: order?._id,
      status: order?.status || 'Shipped',
      estimatedDelivery: order?.estimatedDelivery || new Date(Date.now() + 3 * 86400000),
      currentHub: status === 'Delivered' ? 'Delivered' : status === 'Out for Delivery' ? 'Last Mile Delivery Van' : 'Regional Sorting Facility',
      checkpoints,
      recipient: order?.address?.fullName || order?.userId?.name || 'Customer'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSupplierCatalog,
  importSupplierProduct,
  getCarrierTracking
};
