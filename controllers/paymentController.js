const { instance } = require('../config/razorpay');
const Course = require('../models/Course.model');
const User = require('../models/User.model');
const mailSender = require('../utils/mailSender.util');
const {
  courseEnrollmentEmail,
} = require('../mail/templates/coureEnrollmentEmail');

// Capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
  try {
    // Get course id and user id
    const { course_id } = req.body;
    const userId = req.user.id;
    // validation
    // Validate course ID
    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valide course id',
      });
    }
    // Valid courseDetails
    let courseDetails;
    try {
      courseDetails = await Course.findById(course_id);
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: 'Could not find the course',
        });
      }
      // Check if the user already paid for the same course
      const uId = new mongoose.Types.ObjectId(userId); // Convert userId (string) to ObjectId
      if (courseDetails.studentsEnrolled.includes(uId)) {
        return res.status(200).json({
          success: false,
          message: 'Student is alreay enrolled',
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    // Prepare Razorpay order
    const amount = courseDetails.price;
    const currency = 'INR';

    const options = {
      amount: amount * 100, //Razorpay requires amount in paise
      currency,
      receipt: Date.now().toString() + Math.random().toString().slice(2, 8), // Unique order ID
      notes: {
        courseId: course_id,
        userId,
        // It is needed in signature as when the req come from the razorpay we don't have the course id and userid
      },
    };

    // Create Razorpay Order
    try {
      // Initiate the payment using Razorpay
      const paymentResponse = await instance.orders.create(options);
      console.log(paymentResponse);
      // return res
      return res.status(200).json({
        success: true,
        courseName: courseDetails.courseName,
        courseDescription: courseDetails.courseDescription,
        thumbnail: courseDetails.thumbnail,
        orderId: paymentResponse.id,
        currency: paymentResponse.currency,
        amount: paymentResponse.amount,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Could not initiate order',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while capturing the payment',
    });
  }
};

// Verify signature of Razorpay
exports.verifySignature = async (req, res) => {
  try {
    // Extract Webhook Signature & Secret
    const webhookSecret = '12345678';
    const signature = req.headers['x-razorpay-signature']; // Razorpay sends a signature in the request header (x-razorpay-signature) to verify authenticity

    const shasum = crypto.createHmac('sha256', webhookSecret); // Create HMAC with SHA-256
    shasum.update(JSON.stringify(req.body)); // The update() method of crypto.createHmac() requires a string or a buffer, but req.body or req.headers is usually an object (JSON).
    const digest = shasum.digest('hex'); // the output of the hash algo is called digest which is in the form hexadecimal

    // Compare Hash With Razorpay’s Signature
    if (signature === digest) {
      console.log('payment is authorized');

      // Extract Course & User Details
      const { courseId, userId } = req.body.payload.payment.entity.notes;

      try {
        // fullfil the action
        // find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
          { _id: courseId },
          { $push: { studentsEnrolled: userId } },
          { new: true }
        );

        if (!enrolledCourse) {
          return res.status(500).json({
            success: false,
            message: 'course not found',
          });
        }
        console.log(enrolledCourse);

        // find the student and add course to their list of enrolled courses
        const enrolledStudent = await User.findOneAndUpdate(
          { _id: userId },
          {
            $push: {
              courses: courseId,
            },
          },
          { new: true }
        );

        console.log(enrolledStudent);

        // Send Enrollment Confirmation Email
        const emailResponse = await mailSender(
          enrolledStudent.email,
          'Congratulations',
          'you are onboarded into new Course'
        );

        console.log(emailResponse);
        res.status(200).json({
          success: true,
          message: 'signature verified and coures Added',
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'invalid request',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while verifying signature',
    });
  }
};
