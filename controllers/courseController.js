const Course = require('../models/Course.model');
const Category = require('../models/Category.model');
const User = require('../models/User.model');
const { uploadImageToCloudinary } = require('../utils/imageUploader.util');

// create course handler
exports.createCourse = async (req, res) => {
  try {
    //fetch data
    const { courseName, courseDescription, whatYouWillLearn, price, category } =
      req.body;

    //get thumbnail
    const thumbnail = req.files.thumbnailImage;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // need instructor details
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);
    console.log('Instructor Details: ', instructorDetails);

    // if instructor not found
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: 'Instructor Details not found',
      });
    }

    // check given category is valid or not
    const categoryDetails = await Category.findById(category); // here the category we get in the req is id as we passed it as id in the course schema
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Category Details not found',
      });
    }

    //Upload Image to Cloudinary
    const uploaded_thumbnail = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    // create an entry for new course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      category: categoryDetails._id,
      thumbnail: uploaded_thumbnail.secure_url,
    });

    // add the new course to the user shcema of Instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // update Category schem HM//
    await Category.findByIdAndUpdate(
      category,
      {
        $set: {
          name: courseName,
          description: courseDescription,
        },
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Course created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while creating course',
    });
  }
};

// get all course handler function
exports.getAllCourses = async (req, res) => {
  try {
    const allCourse = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndreviews: true,
        studentsEnrolled: true,
      }
    )
      .populate('instructor')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Data for all courses fetched successfully',
      data: allCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while fetching ALL course',
    });
  }
};

// get specifc course using id very thing must be populated
// get course details
exports.getCourseById = async (req, res) => {
  try {
    const course_id = req.body;
    const specific_course = await Course.findById(course_id)
      .populate({
        path: 'instructor', //inside the courseSchema add the instructor details
        populate: {
          path: 'additionalDetails', // now inside the instructor(UserSchema) add the additinalDetails
        },
      })
      .populate('category')
      .populate('ratingAndreviews')
      .populate({
        path: 'courseContent', // now courseContent is ref with section
        populate: {
          path: 'subSection', //  now the sectionSchema have the subSection field
        },
      })
      .exec();

    if (!specific_course) {
      return res.status(400).json({
        success: false,
        message: `No course availabel with this ID : ${course_id} `,
      });
    }

    res.status(200).json({
      success: true,
      message: `Course with ${course_id} get fetched`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while fecthing this course',
    });
  }
};
