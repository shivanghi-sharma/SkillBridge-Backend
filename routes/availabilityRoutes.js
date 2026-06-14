const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { addSlot , getSlotsBySeller , deleteSlot } = require('../controllers/availabilityController')

router.post('/',protect, addSlot)
router.get('/:sellerId' , getSlotsBySeller) //public - buyers can see this
router.delete('/:slotId', protect , deleteSlot)

module.exports = router



