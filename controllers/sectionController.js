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
    );
    //how to use section , subsection to populate them together

    // return response
    res.status(200).json({
      success: true,
      message: 'section created successfully',
      data: updatedCourseDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Error while creating section',
    });
  }
};

// update section
exports.updateSection = async (req, res) => {
  try {
    // fetch data
    const { sectionName, sectionId } = req.body;
    // data validation
    if (!sectionName || !sectionId) {
      return res.status(500).json({
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
    // return res
    res.status(200).json({
      success: true,
      message: 'section updated successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Error while updating section',
    });
  }
};

// delete section
exports.deleteSection = async (req, res) => {
  try {
    //fetch id -> assuming section id in params
    const { sectionId } = req.params;

    if (!sectionId) {
      return res.status(500).json({
        success: false,
        message: 'All fields are required',
      });
    }
    // delete the section
    const deletedSection = await Section.findByIdAndDelete(sectionId);

    // return res
    return res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
      data: deletedSection,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Error while deleting section',
    });
  }
};
