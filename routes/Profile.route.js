const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth.middleware');

// import the controllers
const {
  deleteAccount,
  updateProfile,
  getAllUserDetails,
} = require('../controllers/profileController');

//profile routes

//Delete user Account
router.delete('/deleteProfile',auth, deleteAccount);
router.put('/updateProfile', auth, updateProfile);
router.get('/getuserdetails', auth, getAllUserDetails);

//Get Enroller Courses
// router.get("/getEnrolledCourses",auth,getEn)
router.put('/updateDisplayPicture', auth, updateProfile);

module.exports = router;
