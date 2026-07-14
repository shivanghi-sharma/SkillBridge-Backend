const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const http = require('http')
const {Server} = require('socket.io')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const availabilityRoutes = require('./routes/availabilityRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const startAutoRelease = require('./utils/autoRelease')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

dotenv.config() //lets you read secret values from .env

const app = express() //creates the server

// Security headers
app.use(helmet())

// Rate limiting — max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' }
})
app.use('/api', limiter)

const adminRoutes = require('./routes/adminRoutes')
app.use('/api/admin', adminRoutes)

//Create HTTP server manually - needed for socket.io
const server = http.createServer(app)

//Attach socket.io to the server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
})

// Connect to MongoDB
connectDB()

// Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true })) //allows backend to talk to frontend by allowing incoming req from PORT 5173
app.use(express.json()) //converts json into JS object for express to understand and validate req.body
app.use(cookieParser()) //reads cookies from the browser

// Routes
app.use('/api/auth', authRoutes)  // here /api tell This URL is for backend APIs
app.use('/api/users', userRoutes)
app.use('/api/availability' , availabilityRoutes)
app.use('/api/bookings',bookingRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/payments', paymentRoutes)

// Any request that starts with `/api/auth` gets handed to `authRoutes`. Then inside authRoutes, the rest of the URL is matched.

// So the full URLs become:
// POST /api/auth/register  → register()
// POST /api/auth/login     → login()
// POST /api/auth/logout    → logout()
// POST /api/auth/refresh   → refreshToken()

app.get('/', (req, res) => {
  res.send('SkillBridge API is running')
})

// Start cron job
startAutoRelease()

//Socket.io logic 
io.on('connection',(socket)=> {
  console.log('User connected: ', socket.id)

  //User joins a booking room 
  socket.on('Join_room',(bookingId) => {
    socket.join(bookingId)
    console.log('User joined room: ${bookingId}')
  })

  //User sends a message
  socket.on('send_message', (data)=> {
    //Broadcast to everyone in the room except the sender
    socket.to(data.bookingId).emit('receive-message', data)
  })

  //Typing indicator
  socket.on('typing',(data)=> {
    socket.to(data.bookingId).emit('typing', data)
  })

  socket.on('disconnect',() => {
    console.log('User disconnected', socket.id)
  })
})

//Export io so we can use it in other files if needed
module.export = {io}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

//flow = request -> middleWare(check token) -> routes(which logic to launch or redirect to) -> Controller(actual logic) 