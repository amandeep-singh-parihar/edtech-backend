const Profile = require('../models/Profile.model');
const User = require('../models/User.model');
// profile details is already there as we marked them null so don't need to create it just update it with real data
exports.updateProfile = async (req, res) => {
  try {
    // fetch data
    const { gender, dateOfBirth, about, contactNumber } = req.body;
    // get user id
    const userId = req.user.id;
    // validation
    if (!gender || !contactNumber || !userId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // find profile and update
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    // Get the profile ID from the user's details
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

    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    await profileDetails.save();

    // return res
    res.status(200).json({
      success: true,
      message: 'Profile Updated successfully',
      data: profileDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while updating profile',
    });
  }
};

// delete account (profile)

exports.deleteAccount = async (req, res) => {
  try {
    // get id
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
      message: 'Error while updating profile',
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
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while fetching',
    });
  }
};
