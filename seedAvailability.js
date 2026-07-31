const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('./models/User')
const Availability = require('./models/Availability')

dotenv.config()

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err))

const seed = async () => {
  try {
    const sellers = await User.find({ role: 'seller' })
    console.log(`Found ${sellers.length} sellers`)

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const times = [
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '14:00', end: '15:00' },
      { start: '16:00', end: '17:00' }
    ]

    let added = 0

    for (const seller of sellers) {
      // Check if they already have slots
      const existing = await Availability.find({ seller: seller._id })
      if (existing.length === 0) {
        // Give them 2 random slots
        const day1 = days[Math.floor(Math.random() * days.length)]
        let day2 = days[Math.floor(Math.random() * days.length)]
        while (day2 === day1) {
          day2 = days[Math.floor(Math.random() * days.length)]
        }

        const time1 = times[Math.floor(Math.random() * times.length)]
        const time2 = times[Math.floor(Math.random() * times.length)]

        await Availability.create({
          seller: seller._id,
          day: day1,
          startTime: time1.start,
          endTime: time1.end,
          isBooked: false
        })

        await Availability.create({
          seller: seller._id,
          day: day2,
          startTime: time2.start,
          endTime: time2.end,
          isBooked: false
        })
        added++
      }
    }

    console.log(`Added availability for ${added} sellers!`)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

seed()
