//protect routes(check token)
//Middleware is code that runs between the request and the controller. Like a security checkpoint.

const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, access denied' })
    }

    // Extract just the token (remove "Bearer " part)
    const token = authHeader.split(' ')[1]

    // Verify the token - was it created by our server or has it expired?
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user to request object
    const user = await User.findById(decoded.id).select('-password -refreshToken')
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }
    
    req.user = user

    // tells the express Move on to the controller
    next()

  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' })
  }
}

module.exports = { protect }


// `req.headers.authorization`** — when your frontend sends a request with a token, it puts it in the header like this:
// Authorization: Bearer eyJhbGciO...