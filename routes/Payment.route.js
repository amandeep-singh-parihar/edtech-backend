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

module.exports = router;
