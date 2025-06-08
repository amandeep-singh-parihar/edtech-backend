require('dotenv').config();
const Course = require('../models/Course.model');
const Category = require('../models/Category.model');
const User = require('../models/User.model');
const { uploadImageToCloudinary } = require('../utils/imageUploader.util');
const { convertSecondsToDuration } = require('../utils/secToDuration.util.js');
const CourseProgress = require('../models/CourseProgress.model.js');
const Section = require('../models/Section.model.js');
const SubSection = require('../models/Subsection.model.js');

// Create course handler
exports.createCourse = async (req, res) => {
  try {
    //fetch data
    const {
      courseName,
      courseDescription,
      whatWillYouLearn,
      price,
      category,
      tags,
      status,
      instructions,
    } = req.body;

    //get thumbnail
    const thumbnail = req.files?.thumbnail;

    console.log('Request Body: ', req.body);
    console.log('Request Files: ', req.files);

    // validation
    if (
      !thumbnail ||
      !courseName ||
      !courseDescription ||
      !price ||
      !category ||
      !whatWillYouLearn ||
      !instructions ||
      !status ||
      !tags
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Debug Debug Debug DebugDebugDebugDebugDebugDebugDebugDebugDebugDebugDebugDebug
    // if (!thumbnail) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'Thumbnail is required',
    //   });
    // }

    // if (!courseName) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'courseName is required',
    //   });
    // }
    // if (!courseDescription) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'courseDescription is required',
    //   });
    // }
    // if (!price) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'price is required',
    //   });
    // }

    // if (!category) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'category is required',
    //   });
    // }

    // if (!whatWillYouLearn) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'whatWillYouLearn is required',
    //   });
    // }

    // if (!instructions) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'instructions is required',
    //   });
    // }
    // if (!status) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'status is required',
    //   });
    // }
    // if (!tags) {
    //   return res.status(400).json({
    //     succes: false,
    //     message: 'tags is required',
    //   });
    // }
    // Debug Debug Debug DebugDebugDebugDebugDebugDebugDebugDebugDebugDebugDebugDebug

    // need instructor details
    const instructorId = req.user.id;
    const instructorDetails = await User.findById(instructorId);
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
      courseDescription: courseDescription,
      whatWillYouLearn,
      price,
      thumbnail: uploaded_thumbnail.secure_url,
      category,
      instructor: instructorId,
      tags,
      status,
      instructions,
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
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (error) {
    console.error('Error while creating course: ', error);
    res.status(500).json({
      success: false,
      message: 'Error while creating course',
      error: error.message,
    });
  }
};

// Get all course handler function
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
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const specific_course = await Course.findById(courseId)
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
        message: `No course availabel with this ID : ${courseId} `,
      });
    }

    let totalDurationInSeconds = 0;
    specific_course.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(
          subSection.timeDurationInSeconds
        );
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    res.status(200).json({
      success: true,
      message: `Course with ${courseId} get fetched`,
      course: specific_course, // Sending the course data in the response
    });
  } catch (error) {
    console.error(error); // Debugging
    res.status(500).json({
      success: false,
      message: 'Error while fetching this course',
    });
  }
};

exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.files) {
      console.log('thumbnail update');

      const thumbnail = req.files.thumbnail;
      // validation

      // if(!thumbnail){
      //   console.log("thumbnail is missing *****************************");
      // }

      // validation

      const thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      course.thumbnail = thumbnailImage.secure_url;
    }

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (
          key === 'category' &&
          typeof updates[key] === 'object' &&
          updates[key] !== null &&
          updates[key]._id
        ) {
          course[key] = updates[key]._id;
        } else {
          course[key] = updates[key];
        }
      }
    }

    await course.save();

    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: 'instructor',
        populate: {
          path: 'additionalDetails',
        },
      })
      .populate('category')
      .populate('ratingAndreviews')
      .populate({
        path: 'courseContent',
        populate: {
          path: 'subSection',
        },
      })
      .exec();

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: 'instructor',
        populate: {
          path: 'additionalDetails',
        },
      })
      .populate('category')
      .populate('ratingAndreviews')
      .populate({
        path: 'courseContent',
        populate: {
          path: 'subSection',
        },
      })
      .exec();

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });

    console.log('courseProgressCount : ', courseProgressCount);

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id;

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'courseContent',
        populate: {
          path: 'subSection',
        },
      })
      .exec();

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve instructor courses',
      error: error.message,
    });
  }
};
// Delete the Course
// Delete the Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      });
    }

    // Delete course progress records
    await CourseProgress.deleteMany({ courseID: courseId });

    // Delete sections and sub-sections
    const courseSections = course.courseContent;
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId);
      if (section) {
        const subSections = section.subSection;
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId);
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId);
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
