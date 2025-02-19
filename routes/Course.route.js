const express = require('express');
const router = express.Router();

// import the controllers
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
} = require('../controllers/courseController');

// categories controller import
const {
  createCategory,
  showAllcategories,
  categoryPageDetails,
} = require('../controllers/categoryController');

// sections controllers import
const {
  createSection,
  updateSection,
  deleteSection,
} = require('../controllers/sectionController');

//subsection controller
const {
  createSubsection,
  updateSubsection,
  deleteSubsection,
} = require('../controllers/subSectionController');

// importing middlware
const {
  auth,
  isAdmin,
  isInstructor,
  isStudent,
} = require('../middlewares/auth.middleware');

// import rating and review controller
const {
  createRating,
  getAverageRating,
  getAllRating,
  getRatingAndReviewsById,
} = require('../controllers/ratingAndreviewController');

/******************************************************course routes***************************************/
/******************************************************course routes***************************************/

// Get all courses
router.get('/getAllCourses', auth, getAllCourses);

//course can only created by instructor
router.post('/createCourse', auth, isInstructor, createCourse);

//add a section to a course
router.post('/addSection', auth, isInstructor, createSection);

//get course details
router.post('/getCourseDetails', auth, getCourseDetails);

//update a section
router.post('/updateSection', auth, isInstructor, updateSection);

//delete a section
router.post('/deleteSection', auth, isInstructor, deleteSection);

//edit sub sectino
router.post('/updateSubSection', auth, isInstructor, updateSubsection);

//create subsection
router.post('/addSubSection', auth, isInstructor, createSubsection);

//delete subsection
router.post('/deleteSubSection', auth, isInstructor, deleteSubsection);

/*****************************************************rating and review***********************************/ /******************************************************rating and review************************************/

// create rating
router.post('/createRating', auth, isStudent, createRating);

// get average rating
router.get('/getAverageRating', getAverageRating);

// get all rating
router.get('/getReviews', getAllRating);

/* *************************************************category********************** */
/* *************************************************category********************** */
router.post('/createCategory', auth, isAdmin, createCategory);

router.get('/showAllCategories', auth, showAllcategories);
module.exports = router;
