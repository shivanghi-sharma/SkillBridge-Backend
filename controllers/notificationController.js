const Notification = require('../models/Notification')

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 notifications
    res.status(200).json(notifications)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message })
  }
}

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    )
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    res.status(200).json(notification)
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message })
  }
}

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    )
    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message })
  }
}
