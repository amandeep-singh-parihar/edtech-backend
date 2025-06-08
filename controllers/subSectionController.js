const SubSection = require('../models/Subsection.model');
const Section = require('../models/Section.model');
const { uploadImageToCloudinary } = require('../utils/imageUploader.util');

// create subsection
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, title, timeDuration, description } = req.body;

    const video = req.files.video;

    //
    // if(!sectionId){
    //   return res.status(400).json({
    //     message:"section id is required"
    //   })
    // }

    //     if(!title){
    //   return res.status(400).json({
    //     message:"title id is required"
    //   })
    // }

    //     if(!description){
    //   return res.status(400).json({
    //     message:"description id is required"
    //   })
    // }

    //     if(!video){
    //   return res.status(400).json({
    //     message:"video is required"
    //   })
    // }
    //

    if (!sectionId || !title || !description || !video) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    const newSubSection = await SubSection.create({
      title,
      timeDuration: `${uploadDetails.duration}`,
      description,
      videoUrl: uploadDetails.secure_url,
    });

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $push: { subSection: newSubSection._id } },
      { new: true }
    ).populate('subSection');

    return res.status(200).json({
      success: true,
      message: 'SubSection created successfully',
      updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create SubSection',
      error: error.message,
    });
  }
};

// update subsection
exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body;
    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: 'SubSection not found',
      });
    }

    if (title !== undefined) {
      subSection.title = title;
    }

    if (description !== undefined) {
      subSection.description = description;
    }
    if (req.files && req.files.video !== undefined) {
      const video = req.files.video;
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      );
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }

    await subSection.save();

    const updatedSection =
      await Section.findById(sectionId).populate('subSection');

    return res.json({
      success: true,
      data: updatedSection,
      message: 'Section updated successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the section',
    });
  }
};

// delete subsection
exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    );

    if (!subSectionId) {
      return res.status(400).json({
        success: false,
        message: 'SubSection Id to be deleted is required',
      });
    }

    const subSection = await SubSection.findByIdAndDelete({
      _id: subSectionId,
    });

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: 'SubSection not found' });
    }

    const updatedSection =
      await Section.findById(sectionId).populate('subSection');

    return res.json({
      success: true,
      data: updatedSection,
      message: 'SubSection deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete SubSection',
      error: error.message,
    });
  }
};
