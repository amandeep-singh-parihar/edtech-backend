const express = require('express');
const router = express.Router();

const { contactus } = require('../controllers/contactUsController.js');

router.post('/contact', contactus);

module.exports = router;