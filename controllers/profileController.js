const Profile = require('../models/Profile.model');
const User = require('../models/User.model');
const { uploadImageToCloudinary } = require('../utils/imageUploader.util');
require('dotenv').config();
// profile details is already there as we marked them null so don't need to create it just update it with real data
exports.updateProfile = async (req, res) => {
  try {
    // Fetch data
    const { firstName, lastName, gender, dateOfBirth, about, contactNumber } = req.body;

    // Get user id
    const userId = req.user.id;

    // Debug logs
    console.log('Request Body:', req.body);
    console.log('User ID:', userId);

    // Validation
    if (!gender || !contactNumber || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Gender, contact number, and user ID are required',
      });
    }

    // Find the user
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get profile ID from user and validate it
    const profileId = userDetails.additionalDetails;
    if (!profileId) {
      return res.status(404).json({
        success: false,
        message: 'Profile details not found for this user',
      });
    }

    // Find the profile
    const profileDetails = await Profile.findById(profileId);
    if (!profileDetails) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Update profile details
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    // Save updated profile
    await profileDetails.save();

    // Update firstName and lastName in User model
    if (firstName) userDetails.firstName = firstName;
    if (lastName) userDetails.lastName = lastName;

    // Save updated user
    await userDetails.save();

    // Populate updated user with profile data
    const updatedUserDetails = await User.findById(userId).populate("additionalDetails");

    // Return response
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUserDetails,
    });

  } catch (error) {
    console.error('Error Details:', error);
    res.status(500).json({
      success: false,
      message: 'Error while updating profile',
      error: error.message,
    });
  }
};

// delete account (profile)
exports.deleteAccount = async (req, res) => {
  try {
    // get id
    // console.log("Printing the user : ",req.user);
    const userId = req.user.id;
    const userDetails = await User.findById(userId);
    //validation
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: 'No user existed!',
      });
    }
    // delete profile
    // cron jobs? schedule the request
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
    // delete user
    await User.findByIdAndDelete(userId);

    //-> hw unenrolled user from all enrolled courses
    // return res
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while deleting profile',
    });
  }
};

//get all user details
exports.getAllUserDetails = async (req, res) => {
  try {
    // get id
    const userId = req.user.id;

    // validate
    const userDetails = await User.findById(userId)
      .populate('additionalDetails')
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: 'User data fetched successfully',
      data: userDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while fetching',
    });
  }
};

// function to check the supported type
function isFileTypeSupported(type, supportedType) {
  return supportedType.includes(type);
}

// Update Profile Picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    // Fetch the user id
    const userId = req.user.id;
    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User Id is empty!!!',
      });
    }
    // Fetch the Profile Picture
    const displayPicture = req.files.displayPicture;
    // Validation
    if (!displayPicture) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a profile picture',
      });
    }

    // Check for supported Type
    const supportedType = ['jpg', 'jpeg', 'png'];
    const imageType = displayPicture.name.split('.')[1].toLowerCase();

    if (!isFileTypeSupported(imageType, supportedType)) {
      return res.status(400).json({
        success: false,
        message: 'File format not supported',
      });
    }
    // Upload image to Cloudinary
    const result = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME
    );

    // Update the profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: result.secure_url },
      { new: true }
    );

    // Return the response
    return res.status(200).json({
      success: true,
      message: 'Profile Picture Updated Successfully',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
      error: error.message,
    });
  }
};
// get enrolled courses -> incomplete
exports.getEnrolledCourses = async (req, res) => {
  try {

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error while fetching enrolled courses',
      error: error.message,
    });
  }
};
