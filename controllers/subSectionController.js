const SubSection = require('../models/Subsection.model');
const Section = require('../models/Section.model');
const { uploadImageToCloudinary } = require('../utils/imageUploader.util');

// create subsection
exports.createSubsection = async (req, res) => {
  try {
    // fetch data from the req body
    const { title, timeDuration, description, sectionId } = req.body;
    // extract file/video
    const video = req.files.videoFile;

    //debug
    console.log('Received Files:', req.files);

    //debug
    if (!req.files || !req.files.videoFile) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded',
      });
    }

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

    //debug
    const existingSection = await Section.findById(sectionId);
    console.log('Section ID:', sectionId);
    console.log('Existing Section:', existingSection);
    //debug

    // update section with this sub section ObjectId
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        $push: {
          subSection: newSubsection._id,
        },
      },
      { new: true }
    ).populate('subSection');
    // log updated section here after adding populate query here

    //DEbug
    console.log('Updated Section:', updatedSection);

    // return response
    res.status(200).json({
      success: true,
      message: 'Subsection created succsssfully',
      data: updatedSection,
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
exports.updateSubsection = async (req, res) => {
  try {
    // fetch all data
    const { title, timeDuration, description, sectionId, subsectionId } =
      req.body;
    // fetch the video
    const video = req.files.videoFile;
    // validation
    // the fileds which are give have to update rest are not
    // if video given update the video to the cloudinary

    // update the subsection
    let updateFields = {};
    if (title) updateFields.title = title;
    if (timeDuration) updateFields.timeDuration = timeDuration;
    if (description) updateFields.description = description;

    // if the video is there to update
    if (video) {
      const videoUploadResponse = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      );
      updateFields.videoUrl = videoUploadResponse.secure_url;
    }
    const update_subsection = await SubSection.findByIdAndUpdate(
      subsectionId,
      updateFields,
      { new: true }
    );

    if (!update_subsection) {
      return res.status(404).json({
        success: false,
        message: 'Subsection not found',
      });
    }

    // update the section no need as the subsection filed is already in it

    // return res
    res.status(200).json({
      success: true,
      message: 'Subsection updated successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error while upadating subsection',
    });
  }
};

// delete subsection
exports.deleteSubsection = async (req, res) => {
  try {
    //fetch the subseciton id
    const { subsectionId } = req.body;
    // validation
    if (!subsectionId) {
      return res.status(500).json({
        success: false,
        message: 'subsection can not be empty',
      });
    }
    // find and delete it
    const delete_subsection = await SubSection.findByIdAndDelete(subsectionId);
    // return the res
    res.status(200).json({
      success: true,
      message: 'Subsection deleted Successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error whie deleting the subsection',
    });
  }
};
