const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { saveMessage , getMessages}  = require('../controllers/chatController')

router.post('/',protect, saveMessage)
router.get('/:bookingId', protect, getMessages)

module.exports = router