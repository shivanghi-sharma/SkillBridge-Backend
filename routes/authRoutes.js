//tell you which URL hits which controller

const express = require('express')
const router = express.Router()
const { register, login, logout, refreshToken } = require('../controllers/authController')

router.post('/register', register)
router.post('/login', login)
router.post('/logout' , logout)
router.post('/refresh', refreshToken)

module.exports = router

// when someone hits THIS url → run THIS function