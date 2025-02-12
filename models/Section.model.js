const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
    },
    subsectionName: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSection",
        required: true,
      },
    ],
  },
  { timeStamp: true },
);

module.exports = mongoose.model("Section", sectionSchema);
