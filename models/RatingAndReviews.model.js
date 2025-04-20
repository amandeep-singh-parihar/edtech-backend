const mongoose = require('mongoose');

const RatingAndReviewsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    rating: {
      type: Number,
      required:true,

    },
    review: {
      type: String,
      required:true,

      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RatingAndReview', RatingAndReviewsSchema);
