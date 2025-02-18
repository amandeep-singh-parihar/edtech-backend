const express = require('express');
const router = express.Router();

// import the controllers
const {
  capturePayment,
  verifySignature,
} = require('../controllers/paymentController');

const {
  auth,
  isAdmin,
  isInstructor,
  isStudent,
} = require('../middlewares/auth.middleware');

router.post('/capturePayment', auth, isStudent, capturePayment);
router.post('/verifySignature', verifySignature);

module.exports = router;
