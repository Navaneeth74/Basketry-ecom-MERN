const express = require('express');
const router = express.Router();
const {
  getSupplierCatalog,
  importSupplierProduct,
  getCarrierTracking
} = require('../controllers/externalController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public route for real-time courier tracking telemetry
router.get('/track-courier/:trackingNumber', getCarrierTracking);

// Admin routes for third-party supplier catalog syncing
router.get('/supplier-catalog', protect, admin, getSupplierCatalog);
router.post('/import-product', protect, admin, importSupplierProduct);

module.exports = router;
