const mongoose = require('mongoose')
require('dotenv').config()
const User = require('./models/User')

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sharmavivek23445:q1N89C54h9cZ8V64@cluster0.te2ze2h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const users = await User.find({ portfolio: { $exists: true } })
    console.log('Portfolios found in DB:', users.map(u => ({ email: u.email, portfolio: u.portfolio })))
    process.exit(0)
  })
