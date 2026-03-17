// Validation constants - kept in sync with CLOUDINARY_CONFIG
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_DIMENSIONS = 1200
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png']

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImageFile(file: File): ValidationResult {
  // Check file type
  const allowedTypes = ALLOWED_FORMATS.map((format) =>
    format === 'jpg' ? 'image/jpeg' : `image/${format}`,
  )

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPG and PNG files are allowed',
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
    return {
      valid: false,
      error: `File size must be under ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

export async function validateImageDimensions(
  file: File,
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(img.src)

      if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
        resolve({
          valid: false,
          error: `Image dimensions must be ${MAX_DIMENSIONS}x${MAX_DIMENSIONS}px or smaller`,
        })
      } else {
        resolve({ valid: true })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve({
        valid: false,
        error: 'Could not read image file',
      })
    }

    img.src = URL.createObjectURL(file)
  })
}
