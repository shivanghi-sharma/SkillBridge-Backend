const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createOrder,
  verifyPayment,
  markComplete,
  releasePayment,
  raiseDispute,
  resolveDispute,
  getDisputes
} = require('../controllers/paymentController')

router.post('/create-order', protect, createOrder)
router.post('/verify', protect, verifyPayment)
router.post('/complete', protect, markComplete)
router.post('/release', protect, releasePayment)
router.post('/dispute', protect, raiseDispute)
router.post('/dispute/resolve', protect, resolveDispute)
router.get('/disputes', protect, getDisputes)
router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId })
    if (!payment) return res.status(404).json({ message: 'No payment found' })
    res.status(200).json(payment)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

module.exports = router