const axios = require('axios')
const crypto = require('crypto')
const Payment = require('../models/Payment')
const Booking = require('../models/Booking')
const Dispute = require('../models/Dispute')
const Notification = require('../models/Notification')

// Razorpay REST client setup — using axios instead of their broken SDK
const razorpayAPI = axios.create({
  baseURL: 'https://api.razorpay.com/v1',
  auth: {
    username: process.env.RAZORPAY_KEY_ID,
    password: process.env.RAZORPAY_KEY_SECRET
  }
})

// -----------------------------------------------
// STEP 1 — Buyer creates a Razorpay order
// -----------------------------------------------
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body

    const booking = await Booking.findById(bookingId).populate('seller', 'hourlyRate')
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    if (booking.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' })
    }

    const existing = await Payment.findOne({ booking: bookingId })
    if (existing) return res.status(400).json({ message: 'Payment already exists' })

    const hourlyRate = booking.seller.hourlyRate || 0
    const duration = booking.duration || 60
    
    // Calculate amount based on hourly rate and duration (in minutes)
    // Formula: (hourlyRate * 100) * (duration / 60)
    let amount = Math.round((hourlyRate * 100) * (duration / 60))
    
    // Razorpay requires a minimum amount of 100 paise (1 INR)
    if (amount < 100) {
        amount = 100 // Set minimum to 1 INR if it's a free or very cheap session
    }

    // Create order via Razorpay REST API directly
    const { data: order } = await razorpayAPI.post('/orders', {
      amount,
      currency: 'INR',
      receipt: `receipt_${bookingId}`
    })

    const payment = await Payment.create({
      booking: bookingId,
      buyer: req.user.id,
      seller: booking.seller._id,
      amount: amount / 100, // store in INR
      razorpayOrderId: order.id,
      status: 'PENDING'
    })

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id
    })
  } catch (error) {
    const errorMsg = error.response?.data?.error?.description || error.message || 'Payment creation failed'
    res.status(500).json({ message: errorMsg, error: error.response?.data || error.message })
  }
}

//Step 2 - Backend Verifies Payment Signature

const verifyPayment = async (req,res) => {
    try{
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body
    // === THIS IS THE IMPORTANT PART  ===
    // Razorpay sends a signature which is a HMAC-SHA256 hash of:
    // razorpayOrderId + "|" + razorpayPaymentId
    // signed with your KEY SECRET
    // We recreate this hash on our server and compare it
    // If they match — payment is genuine, nobody tampered with it
    // If they don't match — someone tried to fake the payment

    const body = razorpayOrderId + '|' + razorpayPaymentId

    const expectedSignature = crypto
    .createHmac('sha256',process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

    const isValid = expectedSignature === razorpaySignature

    if(!isValid){
        //Signature mismatch - mark as FAILED

        await Payment.findOneAndUpdate(
            { razorpayOrderId },
            {status: 'FAILED'}
    )
    return res.status(400).json({message: 'Payment verification failed'})
    }
     
    //Signature matched - money received - mark as HELD
    const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId },
        {
        status: 'HELD',
        razorpayPaymentId,
        razorpaySignature
        },
        { new: true}
    )

    //Also update booking status to confirmed
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' })

    // Notify seller
    const notification = await Notification.create({
      recipient: updatedBooking.seller,
      type: 'payment',
      message: `Payment successful for your session.`,
      link: `/chat/${bookingId}`,
      relatedId: payment._id
    })
    const io = req.app.get('io')
    if (io) {
      io.to(updatedBooking.seller.toString()).emit('new_notification', notification)
    }

    res.status(200).json({message: 'Payment verified. Amount is held', payment})
    }

    catch(error){
        res.status(500).json({message: 'Something went wrong', error: error.message })
    }
}

// -----------------------------------------------
// STEP 3 — Seller marks session as complete
// -----------------------------------------------
const markComplete = async (req, res) => {
  try {
    const { bookingId } = req.body

    const payment = await Payment.findOne({ booking: bookingId })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })

    if (payment.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only seller can mark complete' })
    }

    if (payment.status !== 'HELD') {
      return res.status(400).json({ message: 'Payment is not in HELD state' })
    }

    // Set auto release time to 48 hours from now
    const autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await Payment.findByIdAndUpdate(payment._id, {
      completedAt: new Date(),
      autoReleaseAt
    })

    await Booking.findByIdAndUpdate(bookingId, { status: 'completed' })

    res.status(200).json({
      message: 'Session marked complete. Buyer has 48 hours to raise a dispute.',
      autoReleaseAt
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// -----------------------------------------------
// STEP 4 — Buyer approves → release payment
// -----------------------------------------------
const releasePayment = async (req, res) => {
  try {
    const { bookingId } = req.body

    const payment = await Payment.findOne({ booking: bookingId })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })

    if (payment.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only buyer can release payment' })
    }

    if (payment.status !== 'HELD') {
      return res.status(400).json({ message: 'Payment cannot be released' })
    }

    // In production — trigger actual payout to seller via Razorpay here
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'RELEASED',
      releasedAt: new Date()
    })

    res.status(200).json({ message: 'Payment released to seller' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// -----------------------------------------------
// STEP 5 — Buyer raises a dispute
// -----------------------------------------------
const raiseDispute = async (req, res) => {
  try {
    const { bookingId, reason } = req.body

    const payment = await Payment.findOne({ booking: bookingId })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })

    if (payment.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only buyer can raise dispute' })
    }

    if (payment.status !== 'HELD') {
      return res.status(400).json({ message: 'Cannot dispute this payment' })
    }

    // Check 48 hour window
    if (payment.autoReleaseAt && new Date() > payment.autoReleaseAt) {
      return res.status(400).json({ message: 'Dispute window has expired' })
    }

    // Check dispute doesn't already exist
    const existing = await Dispute.findOne({ payment: payment._id })
    if (existing) return res.status(400).json({ message: 'Dispute already raised' })

    await Payment.findByIdAndUpdate(payment._id, { status: 'DISPUTED' })

    const dispute = await Dispute.create({
      payment: payment._id,
      booking: bookingId,
      raisedBy: req.user.id,
      reason
    })

    res.status(201).json({ message: 'Dispute raised. Admin will review.', dispute })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// -----------------------------------------------
// ADMIN — Resolve dispute
// -----------------------------------------------
const resolveDispute = async (req, res) => {
  try {
    const { disputeId, resolution, sellerPercent, adminNote } = req.body

    const dispute = await Dispute.findById(disputeId).populate('payment')
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' })

    const payment = dispute.payment

    let newPaymentStatus
    if (resolution === 'FULL_RELEASE') newPaymentStatus = 'RELEASED'
    else if (resolution === 'FULL_REFUND') newPaymentStatus = 'REFUNDED'
    else if (resolution === 'PARTIAL') newPaymentStatus = 'RELEASED'

    await Payment.findByIdAndUpdate(payment._id, {
      status: newPaymentStatus,
      releasedAt: new Date()
    })

    await Dispute.findByIdAndUpdate(disputeId, {
      status: 'RESOLVED',
      resolution,
      sellerPercent: resolution === 'PARTIAL' ? sellerPercent : resolution === 'FULL_RELEASE' ? 100 : 0,
      adminNote
    })

    res.status(200).json({ message: `Dispute resolved: ${resolution}` })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// Admin — get all open disputes
const getDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ status: 'OPEN' })
      .populate('raisedBy', 'name email')
      .populate('booking')
      .sort({ createdAt: -1 })

    res.status(200).json(disputes)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  markComplete,
  releasePayment,
  raiseDispute,
  resolveDispute,
  getDisputes
}