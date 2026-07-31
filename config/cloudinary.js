const cloudinary = require('cloudinary')
const CloudinaryStorage = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Storage for profile photos
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillbridge/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }]
  }
})

// Storage for portfolio PDFs
const portfolioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillbridge/portfolios',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'raw'
  }
})

// Storage for resume PDFs
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillbridge/resumes',
    allowed_formats: ['pdf'],
    resource_type: 'raw'
  }
})

const uploadAvatar = multer({ storage: avatarStorage })
const uploadPortfolio = multer({ storage: portfolioStorage })
const uploadResume = multer({ storage: resumeStorage })

module.exports = { uploadAvatar, uploadPortfolio, uploadResume }