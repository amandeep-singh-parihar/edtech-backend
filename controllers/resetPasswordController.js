const User = require('../models/User.model');
const mailSender = require('../utils/mailSender.util');
const bcrypt = require('bcrypt');

// reset password token
exports.resetPasswordToken = async (req, res) => {
  try {
    console.log('Received body:', req.body);
    // get the email from the req,body
    const { email } = req.body;
    // check user for this email,email verification
    if (!email) {
      return res.status(500).json({
        success: false,
        message: 'Email field must not be empty',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(500).json({
        success: false,
        message: `This Email : ${email} is not registered with Us Enter a Valid Email`,
      });
    }

    // create token
    const token = crypto.randomUUID();
    // update user by adding the token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      {
        new: true,
      }
    );
    // create url
    const url = `http://localhost:3000/update-password/${token}`;
    // send mail containing the url
    await mailSender(
      email,
      'Password reset Link',
      `Password reset Link : ${url}`
    );
    // return response
    return res.json({
      success: true,
      message: 'Email sent successfully, please check email and password',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while sending reset the password mail',
    });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Enter all details',
      });
    }

    const existingUser = await User.findOne({ token: token });
    if (!existingUser) {
      return res.json({
        success: false,
        message: 'Token is invalid',
      });
    }

    if (existingUser.resetPasswordExpires < Date.now()) {
      return res.status(500).json({
        success: false,
        message: 'Token is no longer valid',
      });
    }

    if (password !== confirmPassword) {
      return res.status(500).json({
        success: false,
        message: "Password Don't match",
      });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const updatedUser = await User.findOneAndUpdate(
      { token },
      {
        password: hashedPwd,
      },
      { new: true }
    );
    console.log('Updated user after password change is', updatedUser);
    return res.status(200).json({
      success: true,
      message: 'Password Changed successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while reseting password',
    });
  }
};
