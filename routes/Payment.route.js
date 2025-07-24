const express = require('express');
const router = express.Router();

// import the controllers
const {
  capturePayment,
  verifySignature,
  verifyPayment,
  sendPaymentSuccessEmail,
} = require('../controllers/paymentController');

const {
  auth,
  isAdmin,
  isInstructor,
  isStudent,
} = require('../middlewares/auth.middleware');

router.post('/capturePayment', auth, isStudent, capturePayment);
router.post('/verifyPayment', auth, isStudent, verifyPayment);
router.post(
  '/sendPaymentSuccessEmail',
  auth,
  isStudent,
  sendPaymentSuccessEmail
);

// sending the razorpay-key to the frontend
router.get('/get-razorpay-key', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch Razorpay Key',
    });
  }
});

module.exports = router;
