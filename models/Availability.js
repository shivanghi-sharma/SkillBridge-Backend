const mongoose = require('mongoose')

const availabilitySchema = new mongoose.Schema({

    seller:{
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: true
    },
    day:{
        type: String,
        enum: ['Monday' , 'Tuesday' , 'Wednesday' , 'Thrusday' , 'Friday' , 'Saturday' ,'Sunday'],
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    }
} , { timestamps: true})

module.exports = mongoose.model('Availability' , availabilitySchema)