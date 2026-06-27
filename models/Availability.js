const mongoose = require('mongoose')

const availabilitySchema = new mongoose.Schema({

    seller:{
       type: mongoose.Schema.Types.ObjectId, //as ID is fetched from middleware in req.user.id  
       //the objectId creates the link between these two documents and tells to store a MondoDB document ID here
       ref: 'User',
       required: true
    },
    day:{
        type: String,
        enum: ['Monday' , 'Tuesday' , 'Wednesday' , 'Thrusday' , 'Friday' , 'Saturday' ,'Sunday'],
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    }
} , { timestamps: true})

module.exports = mongoose.model('Availability' , availabilitySchema)

//MongoDb automatically creates _id for each and every document

//User Document
// {
//   "_id": ObjectId("65abc123"),
//   "name": "Alex",
//   "role": "seller"
// }

//Availability document
// {
//   "_id": ObjectId("99xyz789"),
//   "seller": ObjectId("65abc123"),
//   "day": "Monday",
//   "startTime": "10:00",
//   "endTime": "11:00"
// }

//now .id = 65abc123