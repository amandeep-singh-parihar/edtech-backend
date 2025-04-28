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
  const { courses } = req.body;
  const userId = req.user.id;

  if (courses.length === 0) {
    return res.json({
      success: false,
      message: 'Provide the courseId',
    });
  }

  let totalAmount = 0;

  for (const courseId of courses) {
    let course;
    try {
      course = await Course.findById(courseId);
      if (!course) {
        return res.status(200).json({
          success: false,
          message: "Course doesn't exist",
        });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(200).json({
          success: false,
          message: 'Student already registered',
        });
      }

      totalAmount += parseInt(course.price);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  console.log('The amount in capturePayment is', totalAmount);
  const currency = 'INR';
  const options = {
    amount: totalAmount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    res.json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, mesage: 'Could not Initiate Order' });
  }
};

// // Verify signature of Razorpay
// exports.verifySignature = async (req, res) => {
//   try {
//     // Extract Webhook Signature & Secret
//     const webhookSecret = '12345678';
//     const signature = req.headers['x-razorpay-signature']; // Razorpay sends a signature in the request header (x-razorpay-signature) to verify authenticity

//     const shasum = crypto.createHmac('sha256', webhookSecret); // Create HMAC with SHA-256
//     shasum.update(JSON.stringify(req.body)); // The update() method of crypto.createHmac() requires a string or a buffer, but req.body or req.headers is usually an object (JSON).
//     const digest = shasum.digest('hex'); // the output of the hash algo is called digest which is in the form hexadecimal

//     // Compare Hash With Razorpay’s Signature
//     if (signature === digest) {
//       console.log('payment is authorized');

//       // Extract Course & User Details
//       const { courseId, userId } = req.body.payload.payment.entity.notes;

//       try {
//         // fullfil the action
//         // find the course and enroll the student in it
//         const enrolledCourse = await Course.findOneAndUpdate(
//           { _id: courseId },
//           { $push: { studentsEnrolled: userId } },
//           { new: true }
//         );

//         if (!enrolledCourse) {
//           return res.status(500).json({
//             success: false,
//             message: 'course not found',
//           });
//         }
//         console.log(enrolledCourse);

//         // find the student and add course to their list of enrolled courses
//         const enrolledStudent = await User.findOneAndUpdate(
//           { _id: userId },
//           {
//             $push: {
//               courses: courseId,
//             },
//           },
//           { new: true }
//         );

//         console.log(enrolledStudent);

//         // Send Enrollment Confirmation Email
//         const emailResponse = await mailSender(
//           enrolledStudent.email,
//           'Congratulations',
//           'you are onboarded into new Course'
//         );

//         console.log(emailResponse);
//         res.status(200).json({
//           success: true,
//           message: 'signature verified and coures Added',
//         });
//       } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//           success: false,
//           message: error.message,
//         });
//       }
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'invalid request',
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error while verifying signature',
//     });
//   }
// };

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
