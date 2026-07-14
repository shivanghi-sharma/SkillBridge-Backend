const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const User = require('../models/User')
const Booking = require('../models/Booking')

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' })
  }
  next()
}

// Get all users
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const users = await User.find()
      .select('-password -refreshToken')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await User.countDocuments()

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// Suspend / unsuspend user
router.put('/users/:id/suspend', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.suspended = !user.suspended
    await user.save()

    res.status(200).json({
      message: `User ${user.suspended ? 'suspended' : 'unsuspended'}`,
      user
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// Get all bookings
router.get('/bookings', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const bookings = await Booking.find()
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Booking.countDocuments()

    res.status(200).json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// Get platform stats
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalSellers = await User.countDocuments({ role: 'seller' })
    const totalBuyers = await User.countDocuments({ role: 'buyer' })
    const totalBookings = await Booking.countDocuments()
    const completedBookings = await Booking.countDocuments({ status: 'completed' })

    res.status(200).json({
      totalUsers,
      totalSellers,
      totalBuyers,
      totalBookings,
      completedBookings
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

module.exports = router