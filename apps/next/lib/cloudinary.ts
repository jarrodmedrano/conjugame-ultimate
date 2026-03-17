import { v2 as cloudinary } from 'cloudinary'

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required')
}

if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error('CLOUDINARY_API_KEY environment variable is required')
}

if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error('CLOUDINARY_API_SECRET environment variable is required')
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export const CLOUDINARY_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_DIMENSIONS: 1200,
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png'],
  MAX_GALLERY_SIZE: 6,
  FOLDER: 'story-bible',
} as const
