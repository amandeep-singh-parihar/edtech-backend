const RatingAndReview = require("../models/RatingAndReviews.model.js")
const Course = require('../models/Course.model.js');

// create rating
exports.createRating = async (req, res) => {
  try {
    // get userId
    const userId = req.user.id;
    // fetch all the data
    const { rating, review, courseId } = req.body;
    // validate all the data
    if (!rating || !review || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Rating, review, and courseId are required',
      });
    }

    //Check if the User enrolled in the course (also can by this method)
    // const courseDetails = await Course.findById(courseId);
    // const uId = new mongoose.Types.ObjectId(userId);
    // if (!courseDetails.studentsEnrolled.includes(uId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Student is not enrolled in the course',
    //   });
    // }

    
    //Check if the User enrolled in the course (more efficient if the whole course details is not required)
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });
    // $elemMatch is a MongoDB operator used to match elements inside an array.
    // $eq: userId checks if any element in the studentsEnrolled array is equal to userId.
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in the course',
      });
    }

    // check if the user already reviewed the course
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    }); // both condition must be met

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: 'Course is already review by the user',
      });
    }

    // create the rating and rewiew
    const rating_and_review = await RatingAndReview.create({
      user: userId,
      course: courseId,
      rating,
      review,
    });

    // update the course with the rating and review
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      {_id:courseId},
      {
        $push: {
          ratingAndreviews: rating_and_review._id,
        },
      },
      { new: true }
    );
    console.log(updatedCourseDetails);
    // return res
    res.status(200).json({
      success: true,
      message: 'Rating and review created',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while creating review',
    });
  }
};

// get average rating
exports.getAverageRating = async (req, res) => {
  try {
    // get course id
    const { courseId } = req.body;
    // validate
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Rating is empty',
      });
    }

    // find all the rating in the rating and review model
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(400).json({
        success: false,
        message: 'Course not found',
      });
    }

    // calculate the average
    const result = await RatingAndReview.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);
    // Here, _id: null means that all documents are grouped together into a single group (i.e., no specific grouping based on a field).

    // return rating
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating, //result[0] contain { _id: null, averageRating: 4.5 }
      });
    }

    // if not rating and review exists
    return res.status(200).json({
      success: true,
      message: 'Average rating is 0, no rating given till now',
      averageRating: 0,
    });
    // return the response
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while getting the average of reviews',
    });
  }
};
// get all rating and reivews
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: 'desc' })
      .populate({
        path: 'User',
        select: 'FirstName LastName email image',
      })
      .populate({
        path: 'course',
        select: 'courseName',
      })
      .exec();

    res.status(200).json({
      success: true,
      message: 'All rating fetched successfully',
      data: allReviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while getting the ratings',
    });
  }
};

// get rating and reviews regarding speicific course id
exports.getRatingAndReviewsById = async (req, res) => {
  try {
    // fetch the course id
    const { courseId } = req.body;
    // validate the course id
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course id must not be empty',
      });
    }
    // fetch the rating and review
    const courseDetails = await Course.findById(courseId);
    // validate the rating and review
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: 'No course with give id',
      });
    }

    const rating_and_review = await RatingAndReview.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);

    // return res if there are reveiw
    if (rating_and_review.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: rating_and_review[0].averageRating, //result[0] contain { _id: null, averageRating: 4.5 }
      });
    }

    // return res if no review and rating are there
    return res.status(200).json({
      success: true,
      message: 'Average rating is 0, no rating given till now',
      averageRating: 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while fetching the Rating and Review of this course',
    });
  }
};
