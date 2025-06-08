const Section = require('../models/Section.model');
const Course = require('../models/Course.model');

exports.createSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, courseId } = req.body;
    // data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    // create section
    const newSection = await Section.create({ sectionName });
    // update course with section objectID
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    ).populate({
      path: 'courseContent',
      populate: {
        path: 'subSection',
      },
    });
    //how to use section , subsection to populate them together

    // return response
    res.status(200).json({
      success: true,
      message: 'section created successfully',
      newSection,
      updatedCourseDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Error while creating section',
      error: error.message,
    });
  }
};

// update section
exports.updateSection = async (req, res) => {
  try {
    // fetch data
    const { sectionName, sectionId, courseId } = req.body;
    // data validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    // update data
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        sectionName,
      },
      { new: true }
    );

    const updatedCourse = await Course.findById(courseId).populate({
      path: 'courseContent',
      populate: {
        path: 'subSection',
      },
    });

    // return res
    res.status(200).json({
      success: true,
      message: 'section updated successfully',
      updatedCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Error while updating section',
      error: error.message,
    });
  }
};

// delete section
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const sectionDetails = await Section.findById(sectionId);

    // //Section ke ander ke subsections delete kiye hai
    sectionDetails.subSection.forEach(async (ssid) => {
      await SubSection.findByIdAndDelete(ssid);
    });
    console.log('Subsections within the section deleted');

    //From course, courseContent the section gets automatically deleted due to cascading delete feature
    await Section.findByIdAndDelete(sectionId);
    console.log('Section deleted');

    const updatedCourse = await Course.findById(courseId).populate({
      path: 'courseContent',
      populate: {
        path: 'subSection',
      },
    });
    return res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
      updatedCourse,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete Section',
      error: error.message,
    });
  }
};
