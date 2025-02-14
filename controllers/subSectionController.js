const SubSection = require('../models/Subsection.model');
const Section = require('../models/Subsection.model');
const { uploadImageToCloudinary } = require('../utils/imageUploader.util');

// create subsection
exports.createSubsection = async (req, res) => {
  try {
    // fetch data from the req body
    const { title, timeDuration, description, sectionId } = req.body;
    // extract file/video
    const video = req.files.videos;
    // validation
    if (!title || !timeDuration || !description || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'ALL fields are required',
      });
    }
    // upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    // create a sub section
    const newSubsection = await SubSection.create({
      title,
      timeDuration,
      description,
      videoUrl: uploadDetails.secure_url,
    });
    // update section with this sub section ObjectId
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        $push: {
          subsectionName: newSubsection._id,
        },
      },
      { new: true }
    );
    // log updated section here after adding populate query here

    // return response
    res.status(200).json({
      success: true,
      message: 'Subsection created succsssfully',
      updatedSection,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while creating subsection',
    });
  }
};

// update subsection

// delte subsection