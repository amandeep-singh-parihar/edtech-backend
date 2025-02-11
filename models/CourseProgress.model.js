const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseProgress'
    },
    completedVideos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubSection',
    }]
}, {timeStamp: true});


module.exports = mongoose.model('CourseProgress', courseProgressSchema);