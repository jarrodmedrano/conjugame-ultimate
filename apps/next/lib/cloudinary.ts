import { v2 as cloudinary } from 'cloudinary'

// Configuration is validated at runtime (not build time) to allow Next.js static analysis
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
  FOLDER: 'conjugame',
} as const
