const ContactUs = require('../models/ContactUs.model.js');

exports.contactus = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNo, message } = req.body;

    if (!firstName || !lastName || !email || !phoneNo || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const newContactUs = await ContactUs.create({
      firstName,
      lastName,
      email,
      phoneNo,
      message,
    });

    res.status(200).json({
      success: true,
      message: 'Message sent Successfully',
      data: newContactUs,
    });
  } catch (error) {
    console.error('Error while contact us : ', error);
    res.status(500).json({
      success: false,
      message: 'Error while creating course',
      error: error.message,
    });
  }
};
