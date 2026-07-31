//what a user looks like in DB

const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
     
    name: {
        type : String,
        required: true,
        trim: true
    },
    email: {
        type:  String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['buyer' , 'seller' , 'admin'],
        default: 'buyer'
    },
    bio: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: []
    },
    hourlyRate: {
        type: Number,
        defalut: 0
    },
    avatar: {           //URL to profile picture (we'll add upload later)
        type: String,
        default: ''
    },
    resume: {
        type: String,
        default: ''
    },
    refreshToken: {  //We store the refresh token in DB so we can invalidate it on logout
        type: String,
        default: ''
    },
    portfolio: {
    type: String,
    default: ''
   }, 
   suspended: {
  type: Boolean,
  default: false
   },
   sessionDuration: {
    type: Number,
    default: 60
   }
}, {timestamps: true})

//Create a User model using this schema and make it available to the entire project
module.exports = mongoose.model('User' , userSchema)