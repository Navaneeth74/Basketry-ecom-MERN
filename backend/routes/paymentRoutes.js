const express = require('express');
const {
  createOrder,
  verifyPayment,
  createSandboxOrder,
  recordPaymentFailure
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/sandbox-checkout', protect, createSandboxOrder);
router.post('/failure', protect, recordPaymentFailure);

module.exports = router;
