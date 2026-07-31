//this file creates a protected API route only looged-in users can access it

const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const User = require('../models/User')
const Review = require('../models/Review')
const { uploadAvatar, uploadPortfolio } = require('../config/cloudinary')


// Protected route — must be logged in
router.get('/profile', protect, async (req, res) => {
  try {
    // req.user.id comes from  decoded in the middleware
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

    // Find user and update only the fields they sent in the req body and recognize others as undefined
    const { name, bio, skills, hourlyRate, avatar, sessionDuration } = req.body

    //`findByIdAndUpdate` — finds the user by their ID (from the token, via middleware) and updates the fields.
    //`{ new: true }` — by default Mongoose returns the OLD document before update. This option tells it to return the UPDATED one instead.
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, skills, hourlyRate, avatar, sessionDuration },
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

// Search + filter sellers (with pagination)
router.get('/search', async (req, res) => {
  try {
    const { skills, minPrice, maxPrice, minRating, page = 1, limit = 14 } = req.query

    // Build filter object dynamically
    const filter = { role: 'seller', suspended: false }

    // Filter by skills
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim())
      filter.skills = { $in: skillArray }
    }

    // Filter by price range
    if (minPrice) filter.hourlyRate = { ...filter.hourlyRate, $gte: Number(minPrice) }
    if (maxPrice) filter.hourlyRate = { ...filter.hourlyRate, $lte: Number(maxPrice) }

    let sortObj = { createdAt: -1 }; // default sort by newest
    if (req.query.sortBy === 'price_asc') sortObj.hourlyRate = 1;
    if (req.query.sortBy === 'price_desc') sortObj.hourlyRate = -1;

    let sellers = await User.find(filter)
      .select('-password -refreshToken')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Always fetch ratings
    const sellersWithRating = await Promise.all(
      sellers.map(async (seller) => {
        const reviews = await Review.find({ seller: seller._id })
        const avg = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0
        return { ...seller.toObject(), avgRating: avg, totalReviews: reviews.length }
      })
    )

    sellers = sellersWithRating;

    // Filter by rating if minRating is provided
    if (minRating) {
      sellers = sellers.filter(s => s.avgRating >= Number(minRating));
    }

    const total = await User.countDocuments(filter)

    res.status(200).json({
      sellers,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// Get single user by ID
//this route must go AFTER the /sellers and /profile routes in userRoutes.js. Otherwise /:id will catch 
// /sellers and /profile requests first and break everything.
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})


// Upload profile photo
router.post('/upload/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true }
    ).select('-password -refreshToken')

    res.status(200).json({ message: 'Avatar uploaded', user })
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' })
  }
})

// Upload portfolio PDF
router.post('/upload/portfolio', protect, uploadPortfolio.single('portfolio'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { portfolio: req.file.path },
      { new: true }
    ).select('-password -refreshToken')

    res.status(200).json({ message: 'Portfolio uploaded', user })
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' })
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