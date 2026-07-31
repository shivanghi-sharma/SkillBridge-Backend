const Availability = require('../models/Availability')

//Seller adds a new time slot
const addSlot = async (req, res) => {
    try {
        const { day, startTime , endTime } = req.body 

        const slot = await Availability.create({
            seller: req.user.id,
            day,
            startTime,
            endTime
        })

        res.status(201).json({message: 'Slot added' , slot})

    }
    catch(error) {
        res.status(500).json({message: 'Something went wrong' , error: error.message})
    }
}

//Get all slots for a specific seller (buyers will see this)
const getSlotsBySeller = async (req, res) => {
    try{
        const slots = await Availability.find({
            seller: req.params.sellerId, //this comes from URL which consist of Seller ID
            isBooked: false
        })
        res.status(200).json(slots)
    } catch(error) {
        res.status(500).json({message: 'Something went wrong', error: error.message})
    }
}

//Seller deletes a slot

const deleteSlot = async(req, res) => {
    try{
        const slot = await Availability.findById(req.params.slotId)

        if(!slot) return res.status(404).json({message: 'Slot not found'})

        //Make sure only the owner can delete it
        if(slot.seller.toString() !== req.user.id){
            return res.status(403).json({message: 'Not allowed'})
        }

        await slot.deleteOne()
        res.status(200).json({message: 'Slot deleted'})
    } catch (error) {
        res.status(500).json({message: 'Something went wrong' , error: error.message})
    }
}

module.exports = {addSlot , getSlotsBySeller , deleteSlot}