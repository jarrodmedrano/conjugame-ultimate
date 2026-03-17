// packages/app/components/ImageGenerateForm/ImageGenerateForm.types.ts
import type { ImageStyle } from '../../../../apps/next/lib/validations/generate-image'
import type { EntityImage } from '../../types/entity-image'

export type { ImageStyle }

export interface ImageGenerateFormProps {
  entityType: 'character' | 'location' | 'story' | 'timeline'
  entityName: string
  entityDescription: string
  entityId: number
  isPrimary: boolean
  onGenerated: (image: EntityImage) => void
  onCancel: () => void
}
