const Message = require('../models/Message')
const Booking = require('../models/Booking')
const Notification = require('../models/Notification')

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

        // Notify the other user
        const booking = await Booking.findById(bookingId)
        if (booking) {
            const recipientId = booking.buyer.toString() === req.user.id 
                ? booking.seller 
                : booking.buyer;

            const notification = await Notification.create({
                recipient: recipientId,
                type: 'chat',
                message: `New message from ${populated.sender.name}`,
                link: `/chat/${bookingId}`,
                relatedId: bookingId
            })
            
            const io = req.app.get('io')
            if (io) {
                io.to(recipientId.toString()).emit('new_notification', notification)
            }
        }

        res.status(201).json(populated)
    } catch (error) {
        res.status(500).json({message: 'Something went wrong'})
    }
}

//Get all messages for a booking

const getMessages = async (req,res) => {
    try{
        const messages = await Message.find({ bookingId: req.params.bookingId })
        .populate('sender','name avatar')
        .sort({ createdAt: 1})
        res.status(200).json(messages)
    }
    catch (error) {
        res.status(500).json({message: 'something went wrong'})
    }
}

module.exports = {saveMessage, getMessages}