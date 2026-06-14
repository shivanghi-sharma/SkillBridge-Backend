//this file creates a protected API route only looged-in users can access it

const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const User = require('../models/User')

// Protected route — must be logged in
router.get('/profile', protect, async (req, res) => {
  try {
    // req.user.id comes from the middleware
    const user = await User.findById(req.user.id).select('-password -refreshToken')
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// Update profile — protected
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, skills, hourlyRate, avatar } = req.body

    // Find user and update only the fields they sent
    //`findByIdAndUpdate` — finds the user by their ID (from the token, via middleware) and updates the fields.
    //`{ new: true }` — by default Mongoose returns the OLD document before update. This option tells it to return the UPDATED one instead.
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, skills, hourlyRate, avatar },
      { new: true }
    ).select('-password -refreshToken')

    res.status(200).json({ message: 'Profile updated', user: updatedUser })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// Public route — fetch all sellers (for buyer homepage)
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('-password -refreshToken')
    res.status(200).json(sellers)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

module.exports = router

//This route is protected using middleware, fetches the authenticated user from DB, and excludes sensitive fields before sending response.

//User sends request → /profile
// protect middleware checks login
// If valid → get user ID
// Fetch user from DB
// Remove sensitive fields
// Send user data