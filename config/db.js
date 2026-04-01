//MongoDB connection

const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.log('MongoDB connection error:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB

// Server starts
// connectDB() is called
// Mongoose tries to connect to Atlas
// If success → server continues
// If fail → server stops

// Import mongoose
// Create async function
// Try → connect
// Log success
// Catch → log error + exit
// Export function