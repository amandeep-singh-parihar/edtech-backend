const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
require('dotenv').config();

//auth
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.body?.token ||
      req.get('Authorization')?.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    //verify the token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token: ', decode);
      req.user = decode;
    } catch (error) {
      console.error('JWT Verification Error: ', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        error: error.message,
      });
    }

    //DEbug
    console.log('Token received: ', token);
    //Debug

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
};

// isstudent
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== 'Student') {
      return res.status(401).json({
        success: false,
        message: 'This is a protect route for students only',
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'User role cannot be verified, please try again',
    });
  }
};

//isInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== 'Instructor') {
      return res.status(401).json({
        success: false,
        message: 'This is a protected route for Instructor only',
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'User role cannot be verified, please try again',
    });
  }
};

//is Admin
exports.isAdmin = async (req, res, next) => {
  try {
    //Debug
    console.log('Priting Account Type : ', req.user.accountType);

    if (req.user.accountType !== 'Admin') {
      return res.status(401).json({
        success: false,
        message: 'This is a protected route for Admin only',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'User role cannot 111 be verified, please try again',
    });
  }
};
