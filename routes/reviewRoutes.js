const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { createReview, getSellerReviews } = require('../controllers/reviewController')

router.post('/', protect, createReview)
router.get('/:sellerId', getSellerReviews)    // public

module.exports = router