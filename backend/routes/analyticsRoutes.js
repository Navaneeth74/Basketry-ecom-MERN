const express = require('express');
const { getAdminStats, exportSalesReportCSV } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', protect, admin, getAdminStats);
router.get('/export-csv', protect, admin, exportSalesReportCSV);

module.exports = router;
