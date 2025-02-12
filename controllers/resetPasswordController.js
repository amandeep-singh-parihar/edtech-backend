const User = require('../models/User.model');
const mailSender = require('../utils/mailSender.util');
const bcrypt = require('bcrypt');

// reset password token
exports.resetPasswordToken = async (req, res) => {
  try {
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
        message: 'Your email is not registered with us',
      });
    }

    // create token
    const token = crypto.randomUUID();
    // update user by adding the token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 560 * 1000,
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
    //fetch data
    const { password, confirmPassword, token } = req.body;
    //validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: 'password not matching',
      });
    }
    //get userdetails from db using token
    const userDetails = await userDetails.findOne({ token: token });
    //if no entry -> invalid token
    if (!userDetails) {
      return res.json({
        success: false,
        message: 'Token invalid',
      });
    }
    //token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: 'Token is expiresd , plz regenerate it',
      });
    }
    // hash pwd
    let hashed_password;
    try {
      hashed_password = await bcrypt.hash(password, 10);
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error in hasing the password',
      });
    }
    // update password
    await User.findByIdAndUpdate(
      { token: token },
      { password: hashed_password },
      { new: true }
    );
    // return res
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error reseting the password',
    });
  }
};
