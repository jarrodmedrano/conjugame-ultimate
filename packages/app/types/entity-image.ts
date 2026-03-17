export interface EntityImage {
  id: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean
  displayOrder: number
  fileName: string
  fileSize: number
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
}

export interface ImageUploadProps {
  existingImages: EntityImage[]
  onUpload: (file: File, isPrimary: boolean) => Promise<void>
  onDelete: (imageId: number) => Promise<void>
  onSetPrimary: (imageId: number) => Promise<void>
  maxImages?: number
  disabled?: boolean
  theme?: string
  // Entity context for AI image generation — optional, omit to hide the generate button
  entityType?: 'character' | 'location' | 'story' | 'timeline'
  entityId?: number
  entityName?: string
  entityDescription?: string
  userId?: string
  onImageGenerated?: (image: EntityImage) => void
}
