// packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.types.ts
import type {
  EntityType,
  GenerateEntityResponse,
} from '../../../../../../apps/next/lib/ai/types'

export interface Story {
  id: number
  title: string
}

export interface GenerateEntityFormProps {
  entityType: EntityType
  stories?: Story[]
  defaultStoryId?: number
  hasApiKey?: boolean
  userId?: string
  onGenerated: (result: GenerateEntityResponse) => void
  onCancel: () => void
}
