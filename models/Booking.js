const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDate: {
    type: String, // e.g., "YYYY-MM-DD"
    required: true
  },
  bookingTime: {
    type: String, // e.g., "14:30"
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''   // buyer can send a note when booking
  }
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)