//protect routes(check token)
//Middleware is code that runs between the request and the controller. Like a security checkpoint.

const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, access denied' })
    }

    // Extract just the token (remove "Bearer " part)
    const token = authHeader.split(' ')[1]

    // Verify the token - was it created by our server or has it expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user id to request object
    // After verifying, we attach the decoded payload (which has { id: userId }) to the request object. Now any controller that runs after this middleware automatically knows who the user is via req.user.id. No need to pass it manually.
    req.user = decoded

    // Move on to the controller
    next()

  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' })
  }
}

module.exports = { protect }


// `req.headers.authorization`** — when your frontend sends a request with a token, it puts it in the header like this:
// Authorization: Bearer eyJhbGciO...