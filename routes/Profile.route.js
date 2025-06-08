const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth.middleware');

// import the controllers
const {
  updateProfile,
  deleteAccount,
  getAllUserDetails,
  updateDisplayPicture,
  getEnrolledCourses,
  instructorDashboard,
} = require('../controllers/profileController.js');

//profile route

//Delete user Account
router.delete('/deleteProfile', auth, deleteAccount);
router.put('/updateProfile', auth, updateProfile);
router.get('/getAllUserDetails', auth, getAllUserDetails);

//Get Enroller Courses
router.get('/getEnrolledCourses', auth, getEnrolledCourses);
router.put('/updateDisplayPicture', auth, updateDisplayPicture);

// Instructor Dashboard
router.get('/instructorDashboard', auth, instructorDashboard);

module.exports = router;
