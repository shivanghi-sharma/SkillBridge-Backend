const Booking = require('../models/Booking')
const Availability = require('../models/Availability')

// Buyer creates a booking
const createBooking = async (req, res) => {
  try {
    const { sellerId, slotId, message } = req.body

    // Check if slot exists and is still available
    const slot = await Availability.findById(slotId)
    if (!slot) return res.status(404).json({ message: 'Slot not found' })
    if (slot.isBooked) return res.status(400).json({ message: 'Slot already booked' })

    // Create the booking
    const booking = await Booking.create({
      buyer: req.user.id,
      seller: sellerId,
      slot: slotId,
      message
    })

    // Mark slot as booked so nobody else can book it
    slot.isBooked = true
    await slot.save()

    res.status(201).json({ message: 'Booking created', booking })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
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
      .populate('slot', 'day startTime endTime')
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
      .populate('slot', 'day startTime endTime')

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

      // Free up the slot again if cancelled
      await Availability.findByIdAndUpdate(booking.slot, { isBooked: false })
    }

    booking.status = status
    await booking.save()

    res.status(200).json({ message: 'Booking updated', booking })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { createBooking, getMyBookings, getBookingById, updateBookingStatus }