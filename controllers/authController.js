//sentotp
const OTP = require('../models/OTP.model');
const User = require('../models/User.model');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
  try {
    const {
      FirstName,
      LastName,
      email,
      contactNumber,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;

    // check all field
    if (
      !FirstName ||
      !LastName ||
      !email ||
      !contactNumber ||
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
    console.log(recentOtp);

    //validate otp
    if (recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found',
      });
    } else if (otp !== recentOtp) {
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
      FirstName,
      LastName,
      email,
      contactNumber,
      password: hashed_password,
      accountType,
      accountDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${FirstName} ${LastName}`,
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
        message: 'User is not registered',
      });
    }

    // generate JWT token, and password
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SCREAT, {
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
        message: 'Password Incorrect',
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
    //get data from the body
    //get old passwrod , newpassword, confirm new password
    //validation
    //update the password
    //send mail= password updated
    //return response
  } catch (error) {}
};
