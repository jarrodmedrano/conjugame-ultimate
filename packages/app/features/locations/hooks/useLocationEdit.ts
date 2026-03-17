import { useState, useCallback, useMemo } from 'react'
import type { GetLocationRow, LocationAttribute } from '@repo/database'
import type { EntityImage } from '../../../types/entity-image'

export interface UseLocationEditArgs {
  location: GetLocationRow
  images?: EntityImage[]
  attributes?: LocationAttribute[]
  onSave?: (updatedLocation: LocationFormData) => void
  onCancel?: () => void
}

export interface LocationFormData {
  name: string
  description: string
  images: EntityImage[]
  attributes: LocationAttribute[]
}

export interface UseLocationEditReturn {
  formData: LocationFormData
  isEditing: boolean
  isDirty: boolean
  startEditing: () => void
  cancelEditing: () => void
  updateField: (
    field: keyof LocationFormData,
    value: string | EntityImage[] | LocationAttribute[],
  ) => void
  saveChanges: () => void
  resetForm: () => void
}

function createInitialFormData(
  location: GetLocationRow,
  images: EntityImage[] = [],
  attributes: LocationAttribute[] = [],
): LocationFormData {
  return {
    name: location.name,
    description: location.description || '',
    images,
    attributes,
  }
}

function checkIsDirty(
  formData: LocationFormData,
  location: GetLocationRow,
): boolean {
  return (
    formData.name !== location.name ||
    formData.description !== (location.description || '')
  )
}

export function useLocationEdit(
  args: UseLocationEditArgs,
): UseLocationEditReturn {
  const { location, images = [], attributes = [], onSave, onCancel } = args

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<LocationFormData>(() =>
    createInitialFormData(location, images, attributes),
  )

  const isDirty = useMemo(
    () => checkIsDirty(formData, location),
    [formData, location],
  )

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setFormData(createInitialFormData(location, images, attributes))
    if (onCancel) {
      onCancel()
    }
  }, [location, images, attributes, onCancel])

  const updateField = useCallback(
    (
      field: keyof LocationFormData,
      value: string | EntityImage[] | LocationAttribute[],
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
    setFormData(createInitialFormData(location, images, attributes))
  }, [location, images, attributes])

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
