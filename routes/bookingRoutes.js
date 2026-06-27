const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus
} = require('../controllers/bookingController')

router.post('/', protect, createBooking)
router.get('/my', protect, getMyBookings)
router.get('/:bookingId', protect, getBookingById)
router.put('/:bookingId', protect, updateBookingStatus)

module.exports = router