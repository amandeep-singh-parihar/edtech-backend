const express = require('express');
const router = express.Router();

// import the controllers
const {
  login,
  signup,
  sendOtp,
  changePassword,
} = require('../controllers/authController');

const {
  resetPassword,
  resetPasswordToken,
} = require('../controllers/resetPasswordController');

const { auth } = require('../middlewares/auth.middleware');

// Authentication routes

//Route for user login
router.post('/login', login);

//Route for user signup
router.post('/signup', signup);

//Route for sending OTP to the user's email
router.post('/sendOtp', sendOtp);

//Route for Changing the password
router.post('/changepassword', auth, changePassword);

// reset password

// Route for generating a reset password token
router.post('/reset-password-token', resetPasswordToken);

// Route for resetting user's password after verification
router.post('/reset-password', resetPassword);

//Export the router for use in the main application
module.exports = router;
