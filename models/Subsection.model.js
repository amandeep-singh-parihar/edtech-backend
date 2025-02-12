const mongoose = require("mongoose");

const SubsectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    timeDuration: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
    },
  },
  { timeStamp: true },
);

module.exports = mongoose.model("SubSection", SubsectionSchema);
