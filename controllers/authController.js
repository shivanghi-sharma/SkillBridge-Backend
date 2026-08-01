//Logic for register/login

const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//Helper function to generate tokens

//Access token used to let the server know you are logged in ,You prove it by sending the Access Token in the request header
//  and i can ask for my profile dashboard , stpred in App's memory

const generateAccessToken = (userId) => { 
    return jwt.sign({id: userId} , process.env.JWT_SECRET , {expiresIn : '1d'}) //remeber to hange it back to 15m before deploying
}

//Header — says what algorithm was used to create this token
//Payload — the actual data we stored inside it, like { id: "userId123" }
//Signature — a secret stamp that proves this token was created by OUR server and nobody faked it

const generateRefreshToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_REFRESH_SECRET , {expiresIn: '7d'})
}

//REGISTER LOGIC 

const register = async(req , res) => {
    try {
        const{name , email , password , role, bio, skills} = req.body 

        let parsedSkills = []
        if (skills) {
            parsedSkills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills
        }

        const resume = req.file ? req.file.path : ''

        //Check if the user exists
        const existingUser = await User.findOne({ email })
        if(existingUser){
            return res.status(400).json({message: 'Email already registered'})
        }

        //Hash the password before saving
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //Create the user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'buyer',
            bio: bio || '',
            skills: parsedSkills,
            resume
        })

        res.status(201).json({message: 'User registered successfully' , userId: user._id})    
    }
    catch (error) {
        res.status(500).json({message: 'Something went wrong' , error: error.message })
    }
}

//LOGIN LOGIC

const login = async (req, res) => {
    try {
        let {email , password} = req.body
        email = email.trim().toLowerCase()
        
        //check if user exists

        const user = await User.findOne({email})
        if( !user) {
            return res.status(400).json({message: 'Invalid email or password'})
        }

        //Compared entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password , user.password)
        if(!isMatch) {
            return res.status(400).json({message: 'Invalid email or password'})
        }

        //IF both passed then GENERATE TOKENS
        
        const accessToken = generateAccessToken(user._id)
        const refreshToken = generateRefreshToken(user._id)

        //Save refresh token in DB
        user.refreshToken = refreshToken
        await user.save()

        //send refresh token as httpOnly cookie (safer than localStorage)
        res.cookie('refreshToken' , refreshToken , {
            httpOnly: true,
            secure: false,       //set to true in production (HTTPS)
            sameSite: 'lax',
            maxAge: 7*24*60*60*1000   //7 days in milliseconds
        })

        res.status(200).json({
            message: 'Login successful',
            accessToken, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }
    catch(error) {
        res.status(500).json({message: 'Something went wrong' , error: error.message})
    }
}

//LOGOUT logic

const logout  = async (req, res) => {
    try {
        //Clear the cookie with refresh token
        const token = req.cookies.refreshToken 
        if(! token) return res.status(204).json({message: 'no token found'})

    //Remove refresh token from DB
    const user = await User.findOne({refreshToken: token})
    if(user) {
        user.refreshToken = ''
        await user.save()
    }

    //Clear the cookie
    res.clearCookie('refreshToken')
    res.status(200).json({message: 'Logged out successfully'})
    }

    catch (error) {
        res.status(500).json({message: 'Something went wrong' , error: error.message})
    }
}

//Refresh Token - stored in an HTTPOnly cookie and in DB for LogOut 

const refreshToken = async (req, res) => {

    try {
        const token = req.cookies.refreshToken
        if(!token) return res.status(401).json({message : 'No refresh token'})
        
        //checks if token is vaid or is n0t expired
        const decoded = jwt.verify(token , process.env.JWT_REFRESH_SECRET)

        //Check if this token exsist in DB (not logged out)
        const user = await User.findOne({_id: decoded.id , refreshToken: token})
        if(!user) return res.status(403).json({message: 'Invalid refresh token'})

       //Issue a new access token

       const newAccessToken = generateAccessToken(user._id)

       res.status(200).json({accessToken : newAccessToken})
    }

    catch ( error){
        res.status(403).json({message: 'Token expired or invalid'})
    }
}

module.exports = { register , login , logout , refreshToken}