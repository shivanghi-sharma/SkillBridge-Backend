const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
    booking: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Booking',
         required: true,
         unique: true
    },
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
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'HELD', 'RELEASED', 'FAILED','DISPUTED'],
        default: 'PENDING'
    },
    razorpayOrderId: {
        type: String,
        default: ''
    },
    razorpayPaymentId: {
        type: String,
        default: ''
    },
    razorpaySignature: {
        type: String,
        default: ''
    },
    completedAt: {
        type: Date,
        default: null
    },
    releasedAt: {
        type: Date,
        default: null
    },
    autoReleaseAt: {
        type: Date,
        default: null
    }
}, {timestamps: true})

module.exports = mongoose.model('Payment', paymentSchema)