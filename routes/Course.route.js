const express = require('express');
const router = express.Router();

// import the controllers
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
  getFullCourseDetails,
  editCourse,
  getInstructorCourses,
  deleteCourse,
} = require('../controllers/courseController');

const {
  updateCourseProgress,
} = require('../controllers/courseProgressController.js');

// categories controller import
const {
  createCategory,
  showAllcategories,
  getcategoryPageDetails,
} = require('../controllers/categoryController');

// sections controllers import
const {
  createSection,
  updateSection,
  deleteSection,
} = require('../controllers/sectionController');

//subsection controller
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require('../controllers/subSectionController');

// rating controllers import
const {
  createRating,
  getAverageRating,
  getAllRating,
} = require('../controllers/ratingAndreviewController.js');

// contactus controller

const { contactus } = require('../controllers/contactUsController.js');

// importing middlware
const {
  auth,
  isAdmin,
  isInstructor,
  isStudent,
} = require('../middlewares/auth.middleware');

/******************************************************course routes***************************************/
/******************************************************course routes***************************************/

// Courses can Only be Created by Instructors
router.post('/createCourse', auth, isInstructor, createCourse);
//Add a Section to a Course
router.post('/createSection', auth, isInstructor, createSection);
// Update a Section
router.post('/updateSection', auth, isInstructor, updateSection);
// Delete a Section
router.post('/deleteSection', auth, isInstructor, deleteSection);
// Edit Sub Section
router.post('/updateSubSection', auth, isInstructor, updateSubSection);
// Delete Sub Section
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection);
// Add a Sub Section to a Section
router.post('/addSubSection', auth, isInstructor, createSubSection);
// Get all Registered Courses
router.get('/getAllCourses', getAllCourses);
// Get Details for a Specific Courses
router.get('/getCourseDetails/:courseId', getCourseDetails);
// Get Details for a Specific Courses
router.post('/getFullCourseDetails', auth, getFullCourseDetails);
// Edit Course routes
router.post('/editCourse', auth, isInstructor, editCourse);
// Get all Courses Under a Specific Instructor
router.get('/getInstructorCourses', auth, isInstructor, getInstructorCourses);
// Delete a Course
router.delete('/deleteCourse', deleteCourse);
router.post('/updateCourseProgress', auth, isStudent, updateCourseProgress);

/*****************************************************Category routes (Only by Admin)***********************************/ /******************************************************Category routes (Only by Admin)************************************/

// Category can Only be Created by Admin
router.post('/createCategory', auth, isAdmin, createCategory);
router.get('/showAllCategories', showAllcategories);
router.post('/getCategoryPageDetails', getcategoryPageDetails);

/* ************************************************* Rating and Review********************** */
/* ************************************************* Rating and Review********************** */
router.post('/createRating', auth, isStudent, createRating);

router.get('/getAverageRating', getAverageRating);
router.get('/getReviews', getAllRating);

/* ************************************************* Contact Us********************** */
/* ************************************************* Contact Us********************** */
router.post('/contactUs', contactus);

module.exports = router;
