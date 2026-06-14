const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const availabilityRoutes = require('./routes/availabilityRoutes')

dotenv.config() //lets you read secret values from .env

const app = express() //creates the server

// Connect to MongoDB
connectDB()

// Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true })) //allows backend to talk to frontend by allowing incoming req from PORT 5173
app.use(express.json()) //converts json into JS object for express to understand and validate req.body
app.use(cookieParser()) //reads cookies from the browser

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/availability', availabilityRoutes)

// Any request that starts with `/api/auth` gets handed to `authRoutes`. Then inside authRoutes, the rest of the URL is matched.

// So the full URLs become:
// POST /api/auth/register  → register()
// POST /api/auth/login     → login()
// POST /api/auth/logout    → logout()
// POST /api/auth/refresh   → refreshToken()

app.get('/', (req, res) => {
  res.send('SkillBridge API is running')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

//flow = request -> middleWare(check token) -> Controller(actual logic) ->routes