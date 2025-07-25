const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
    },
    courseDescription: {
      type: String,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    whatWillYouLearn: {
      type: String,
    },
    courseContent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],
    ratingAndreviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ratingAndreview',
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    tag: {
      type: [String],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    studentsEnrolled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    instructions: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
