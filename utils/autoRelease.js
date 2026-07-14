const cron = require('node-cron') //Runs scheduled jobs — for auto-release after 48hrs
const Payment = require('../models/Payment')

const startAutoRelease = () => {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date()

      // Find all HELD payments where auto release time has passed
      const payments = await Payment.find({
        status: 'HELD',
        autoReleaseAt: { $lte: now }
      })

      for (const payment of payments) {
        payment.status = 'RELEASED'
        payment.releasedAt = now
        await payment.save()
        console.log(`Auto released payment: ${payment._id}`)
      }
    } catch (err) {
      console.error('Auto release error:', err)
    }
  })
}

module.exports = startAutoRelease