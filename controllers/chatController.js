const Message = require('../models/Message')

//Save message to DB
const saveMessage = async (req, res) => {
    try{
        const { bookingId , text} = req.body

        const message = await Message.create({
            bookingId,
            sender : req.user.id,
            text
        })

        const populated = await message.populate('sender', 'name avatar')
        res.status(201).josn(populated)
    } catch (error) {
        res.status(500).json({message: 'Something went wrong'})
    }
}

//Get all messages for a booking

const getMessages = async (req,res) => {
    try{
        const message = await Message.find({ bookingId: req.params.bookingId })
        .populate('sender','name avatar')
        .sort({ createdAt: 1})
        res.status(200).json(messages)
    }
    catch (error) {
        res.status(500).json({message: 'something went wrong'})
    }
}

module.exports = {saveMessage, getMessages}