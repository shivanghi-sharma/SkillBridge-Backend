const Booking = require('../models/Booking')
const Availability = require('../models/Availability')
const Notification = require('../models/Notification')
const User = require('../models/User')

// Buyer creates a booking
const createBooking = async (req, res) => {
  try {
    const { sellerId, bookingDate, bookingTime, message } = req.body

    // Fetch seller to get their sessionDuration
    const seller = await User.findById(sellerId)
    if (!seller) return res.status(404).json({ message: 'Seller not found' })

    const duration = seller.sessionDuration || 60

    // Create the booking
    const booking = await Booking.create({
      buyer: req.user.id,
      seller: sellerId,
      bookingDate,
      bookingTime,
      duration,
      message
    })

    // Create Notification for the seller
    const notification = await Notification.create({
      recipient: sellerId,
      type: 'booking',
      message: `You have a new booking request.`,
      link: `/chat/${booking._id}`,
      relatedId: booking._id
    })
    const io = req.app.get('io')
    if (io) {
      io.to(sellerId.toString()).emit('new_notification', notification)
    }

    res.status(201).json({ message: 'Booking created', booking })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Something went wrong', error: error.message })
  }
}

// Get all bookings for logged in user (buyer or seller)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ buyer: req.user.id }, { seller: req.user.id }]
    })
      .populate('buyer', 'name email avatar')
      .populate('seller', 'name email avatar skills hourlyRate')
      .sort({ createdAt: -1 })

    res.status(200).json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// Get single booking details
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('buyer', 'name email avatar')
      .populate('seller', 'name email avatar skills hourlyRate')

    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    // Only buyer or seller of this booking can see it
    const isInvolved =
      booking.buyer._id.toString() === req.user.id ||
      booking.seller._id.toString() === req.user.id

    if (!isInvolved) return res.status(403).json({ message: 'Not allowed' })

    res.status(200).json(booking)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// Update booking status (confirm / cancel / complete)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findById(req.params.bookingId)

    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    // Only seller can confirm or complete
    // Either party can cancel
    const isSeller = booking.seller.toString() === req.user.id
    const isBuyer = booking.buyer.toString() === req.user.id

    if (status === 'confirmed' || status === 'completed') {
      if (!isSeller) return res.status(403).json({ message: 'Only seller can do this' })
    }

    if (status === 'cancelled') {
      if (!isSeller && !isBuyer) return res.status(403).json({ message: 'Not allowed' })
    }

    booking.status = status
    await booking.save()

    // Notify the other party
    const notifyUser = isSeller ? booking.buyer : booking.seller;
    const notification = await Notification.create({
      recipient: notifyUser,
      type: 'booking',
      message: `Your booking status was updated to ${status}.`,
      link: `/chat/${booking._id}`,
      relatedId: booking._id
    })
    const io = req.app.get('io')
    if (io) {
      io.to(notifyUser.toString()).emit('new_notification', notification)
    }

    res.status(200).json({ message: 'Booking updated', booking })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { createBooking, getMyBookings, getBookingById, updateBookingStatus }