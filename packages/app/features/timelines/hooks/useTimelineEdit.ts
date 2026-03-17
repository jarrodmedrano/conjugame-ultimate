import { useState, useCallback, useMemo } from 'react'
import type { GetTimelineRow } from '@repo/database'
import type { EntityImage } from '../../../types/entity-image'

export interface UseTimelineEditArgs {
  timeline: GetTimelineRow
  images?: EntityImage[]
  onSave?: (updatedTimeline: TimelineFormData) => void
  onCancel?: () => void
}

export interface TimelineFormData {
  name: string
  description: string
  images: EntityImage[]
}

export interface UseTimelineEditReturn {
  formData: TimelineFormData
  isEditing: boolean
  isDirty: boolean
  startEditing: () => void
  cancelEditing: () => void
  updateField: (
    field: keyof TimelineFormData,
    value: string | EntityImage[],
  ) => void
  saveChanges: () => void
  resetForm: () => void
}

function createInitialFormData(
  timeline: GetTimelineRow,
  images: EntityImage[] = [],
): TimelineFormData {
  return {
    name: timeline.name,
    description: timeline.description || '',
    images,
  }
}

function checkIsDirty(
  formData: TimelineFormData,
  timeline: GetTimelineRow,
): boolean {
  return (
    formData.name !== timeline.name ||
    formData.description !== (timeline.description || '')
  )
}

export function useTimelineEdit(
  args: UseTimelineEditArgs,
): UseTimelineEditReturn {
  const { timeline, images = [], onSave, onCancel } = args

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<TimelineFormData>(() =>
    createInitialFormData(timeline, images),
  )

  const isDirty = useMemo(
    () => checkIsDirty(formData, timeline),
    [formData, timeline],
  )

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setFormData(createInitialFormData(timeline, images))
    if (onCancel) {
      onCancel()
    }
  }, [timeline, images, onCancel])

  const updateField = useCallback(
    (field: keyof TimelineFormData, value: string | EntityImage[]) => {
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
    setFormData(createInitialFormData(timeline, images))
  }, [timeline, images])

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
