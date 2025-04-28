//sentotp
const OTP = require('../models/OTP.model');
const User = require('../models/User.model');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mailSender = require('../utils/mailSender.util.js');

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(400).json({
        success: false,
        message: 'User already registered',
      });
    }

    //user not existed -> generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log('OTP generated', otp);

    //otp must be unique
    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp });
    }

    const otpPayload = { email, otp };
    //create entry in db for otp
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    res.status(200).json({
      success: true,
      message: 'Otp send successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'Error while sending otp',
    });
  }
};

//signup
exports.signup = async (req, res) => {
  console.log('Incoming Request Body: ', req.body);

  try {
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;

    // check all field
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !accountType ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // check for the password and confirmpassword same or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmPassword dons not match.',
      });
    }

    // check if the user already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User is already registered',
      });
    }

    // find most recent otp
    const recentOtp = await OTP.findOne({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    // Sorts the results by the createdAt field in descending order (-1 means newest first).
    // console.log(recentOtp);
    console.log('Stored OTP : ', recentOtp?.otp);
    console.log('Entered OTP : ', otp);

    //validate otp
    if (!recentOtp) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found',
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // hash password
    let hashed_password;
    try {
      hashed_password = await bcrypt.hash(password, 10);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error in handling the password',
      });
    }

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const userPayload = {
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashed_password,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
    };
    const user = await User.create(userPayload);

    res.status(200).json({
      success: true,
      user,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'User cannot be registered. Please try again',
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    // fetching the fields
    const { email, password, accountType } = req.body;

    // validate the fileds
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: 'Please fill all the fields',
      });
    }

    // is user exits ?
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User is not registered us',
      });
    }

    // generate JWT token, and password
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '2h',
      });

      let userObj = user.toObject();
      userObj.token = token;
      userObj.password = undefined;

      // cookie generate
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie('token', token, options).status(200).json({
        success: true,
        token,
        user: userObj,
        message: 'User Logged in successfully',
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Password is incorrect',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

// change password
exports.changePassword = async (req, res) => {
  try {
    const { password, newPassword, confirmNewPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token.',
      });
    }

    const email = decoded.email;

    // Validate input fields
    if (!password || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message:
          'All fields (password, newPassword, confirmNewPassword) are required.',
      });
    }

    // Check if the user exists
    const user_existed = await User.findOne({ email });
    if (!user_existed) {
      return res.status(404).json({
        success: false,
        message: 'No user exists with this email.',
      });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      password,
      user_existed.password
    );
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password must match.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Send confirmation email
    await mailSender(email, 'Password changed successfully.');

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Error while changing password: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while changing password.',
    });
  }
};
