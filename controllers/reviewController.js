const Review = require('../models/Review')
const Booking = require('../models/Booking')

// Buyer leaves a review after completed session
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body

    // Check booking exists and is completed
    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' })
    }

    // Only the buyer of this booking can review
    if (booking.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' })
    }

    // Check if review already exists for this booking
    const existing = await Review.findOne({ booking: bookingId })
    if (existing) return res.status(400).json({ message: 'Already reviewed this session' })

    const review = await Review.create({
      booking: bookingId,
      reviewer: req.user.id,
      seller: booking.seller,
      rating,
      comment
    })

    res.status(201).json({ message: 'Review submitted', review })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// Get all reviews for a seller
const getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })

    // Calculate average rating
    const average = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0

    res.status(200).json({ reviews, average, total: reviews.length })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { createReview, getSellerReviews }