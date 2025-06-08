//sentotp
require('dotenv').config();
const OTP = require('../models/OTP.model');
const User = require('../models/User.model');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile.model');
const jwt = require('jsonwebtoken');
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
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id);

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password not provided',
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'new password not provided',
      });
    }

    console.log('Old Password from req.body:', oldPassword);
    console.log("User's hashed password from DB:", userDetails?.password);

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: 'The password is incorrect' });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        'Password Updated Successfully',
        `Hello ${updatedUserDetails.firstName},\n\nYour password has been updated successfully.\n\nRegards,\nTeam`
      );

      console.log('Email sent successfully:', emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error('Error occurred while sending email:', error);
      return res.status(500).json({
        success: false,
        message: 'Error occurred while sending email',
        error: error.message,
      });
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error('Error occurred while updating password:', error);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while updating password',
      error: error.message,
    });
  }
};
