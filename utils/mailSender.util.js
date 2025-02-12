const nodemailer = require('nodemailer');
require('dotenv').config();

const mailSender = async (email, title, body) => {
  try {
    let transpoter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = transpoter.sendMail({
      from: 'StudyNotion by Amandeep',
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
    console.log(info);
    return info;
  } catch (error) {
    console.log(error);
  }
};

module.exports = mailSender;
