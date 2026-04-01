const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')

dotenv.config()

const app = express()

// Connect to MongoDB
connectDB()

// Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/auth', authRoutes)

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