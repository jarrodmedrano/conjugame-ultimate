import { useState, useCallback, useMemo } from 'react'
import type { GetStoryRow, StoryAttribute } from '@repo/database'
import type { EntityImage } from '../../../types/entity-image'

export interface UseStoryEditArgs {
  story: GetStoryRow
  images?: EntityImage[]
  attributes?: StoryAttribute[]
  onSave?: (updatedStory: StoryFormData) => void
  onCancel?: () => void
}

export interface StoryFormData {
  name: string
  description: string
  content: string
  images: EntityImage[]
  attributes: StoryAttribute[]
}

export interface UseStoryEditReturn {
  formData: StoryFormData
  isEditing: boolean
  isDirty: boolean
  startEditing: () => void
  cancelEditing: () => void
  updateField: (
    field: keyof StoryFormData,
    value: string | EntityImage[] | StoryAttribute[],
  ) => void
  saveChanges: () => void
  resetForm: () => void
}

function createInitialFormData(
  story: GetStoryRow,
  images: EntityImage[] = [],
  attributes: StoryAttribute[] = [],
): StoryFormData {
  return {
    name: story.title,
    description: '',
    content: story.content,
    images,
    attributes,
  }
}

function checkIsDirty(formData: StoryFormData, story: GetStoryRow): boolean {
  return (
    formData.name !== story.title ||
    formData.content !== story.content ||
    formData.description !== ''
  )
}

export function useStoryEdit(args: UseStoryEditArgs): UseStoryEditReturn {
  const { story, images = [], attributes = [], onSave, onCancel } = args

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<StoryFormData>(() =>
    createInitialFormData(story, images, attributes),
  )

  const isDirty = useMemo(
    () => checkIsDirty(formData, story),
    [formData, story],
  )

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setFormData(createInitialFormData(story, images, attributes))
    if (onCancel) {
      onCancel()
    }
  }, [story, images, attributes, onCancel])

  const updateField = useCallback(
    (
      field: keyof StoryFormData,
      value: string | EntityImage[] | StoryAttribute[],
    ) => {
      setFormData((prevFormData) => {
        return {
          ...prevFormData,
          [field]: value,
        }
      })
    },
    [],
  )

  const saveChanges = useCallback(() => {
    if (onSave) {
      onSave(formData)
    }
    setIsEditing(false)
  }, [formData, onSave])

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData(story, images, attributes))
  }, [story, images, attributes])

  return {
    formData,
    isEditing,
    isDirty,
    startEditing,
    cancelEditing,
    updateField,
    saveChanges,
    resetForm,
  }
}
