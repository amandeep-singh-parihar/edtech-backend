const mongoose = require('mongoose');
const { instance } = require('../config/razorpay');
const Course = require('../models/Course.model');
const User = require('../models/User.model');
const mailSender = require('../utils/mailSender.util');
const {
  courseEnrollmentEmail,
} = require('../mail/templates/coureEnrollmentEmail');
const {
  paymentSuccessEmail,
} = require('../mail/templates/paymentSuccessEmail.js');

const CourseProgress = require('../models/CourseProgress.model.js');

// Capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
  try {
    const { courses } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found in request',
      });
    }

    if (!courses || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide the courseId(s)',
      });
    }

    let totalAmount = 0;

    for (const courseId of courses) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course doesn't exist",
        });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(409).json({
          success: false,
          message: 'Student already registered',
        });
      }

      totalAmount += parseInt(course.price);
    }

    const currency = 'INR';
    const options = {
      amount: totalAmount * 100,
      currency,
      receipt: `receipt_${Math.random().toString().slice(2, 12)}`,
    };

    const paymentResponse = await instance.orders.create(options);

    res.json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.error('ERROR IN capturePayment:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not initiate order',
      error: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  console.log('request in verifyPayment is', req);
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.courses;
  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: 'Payment Failed' });
  }

  let body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res);

    return res.status(200).json({ success: true, message: 'Payment Verified' });
  }
  return res.status(200).json({ success: 'false', message: 'Payment Failed' });
};

const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Please Provide data for Courses or UserId',
    });
  }

  for (const courseId of courses) {
    try {
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
          $push: {
            studentsEnrolled: userId,
          },
        },
        { new: true }
      );

      if (!updatedCourse) {
        return res
          .status(500)
          .json({ success: false, message: 'Course not Found' });
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      const updatedStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      const emailResponse = await mailSender(
        updatedStudent.email,
        `Successfully Enrolled into ${updatedCourse.courseName}`,
        courseEnrollmentEmail(
          updatedCourse.courseName,
          `${updatedStudent.firstName}`
        )
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;

  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: 'Please provide all the fields' });
  }

  try {
    const user = await User.findById(userId);
    await mailSender(
      user.email,
      `Payment Received`,
      paymentSuccessEmail(`${user.firstName}`, amount / 100, orderId, paymentId)
    );
  } catch (error) {
    console.log('error in sending mail', error);
    return res
      .status(500)
      .json({ success: false, message: 'Could not send email' });
  }
};
