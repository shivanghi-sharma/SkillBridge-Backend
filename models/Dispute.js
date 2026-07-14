const mongoose = require('mongoose')

const disputeSchema = new mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        unique: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED'],
        default: 'OPEN'
    },
    resolution: {
        type: String,
        enum: ['FULL_RELEASE', 'FULL_REFUND' , 'PARTIAL' , null],
        default: null
    },
    sellerPercent: {
        type: Number,
        default: 100
    },
    adminNote: {
        type: String,
        default: ''
    }
}, {timestamps: true})

module.exports = mongoose.model('Dispute', disputeSchema)
