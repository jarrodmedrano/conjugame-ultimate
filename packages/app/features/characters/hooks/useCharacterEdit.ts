import { useState, useCallback, useMemo } from 'react'
import type { GetCharacterRow, CharacterAttribute } from '@repo/database'
import type { EntityImage } from '../../../types/entity-image'

export interface UseCharacterEditArgs {
  character: GetCharacterRow
  images?: EntityImage[]
  attributes?: CharacterAttribute[]
  onSave?: (updatedCharacter: CharacterFormData) => void
  onCancel?: () => void
}

export interface CharacterFormData {
  name: string
  description: string
  images: EntityImage[]
  attributes: CharacterAttribute[]
}

export interface UseCharacterEditReturn {
  formData: CharacterFormData
  isEditing: boolean
  isDirty: boolean
  startEditing: () => void
  cancelEditing: () => void
  updateField: (
    field: keyof CharacterFormData,
    value: string | EntityImage[] | CharacterAttribute[],
  ) => void
  saveChanges: () => void
  resetForm: () => void
}

function createInitialFormData(
  character: GetCharacterRow,
  images: EntityImage[] = [],
  attributes: CharacterAttribute[] = [],
): CharacterFormData {
  return {
    name: character.name,
    description: character.description || '',
    images,
    attributes,
  }
}

// Note: isDirty only tracks name and description changes because attributes
// are persisted directly to the server in real-time via AttributeEditor
// (add/delete/blur). The Save button is only needed for name and description.
function checkIsDirty(
  formData: CharacterFormData,
  character: GetCharacterRow,
): boolean {
  return (
    formData.name !== character.name ||
    formData.description !== (character.description || '')
  )
}

export function useCharacterEdit(
  args: UseCharacterEditArgs,
): UseCharacterEditReturn {
  const { character, images = [], attributes = [], onSave, onCancel } = args

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<CharacterFormData>(() =>
    createInitialFormData(character, images, attributes),
  )

  const isDirty = useMemo(
    () => checkIsDirty(formData, character),
    [formData, character],
  )

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setFormData(createInitialFormData(character, images, attributes))
    if (onCancel) {
      onCancel()
    }
  }, [character, images, attributes, onCancel])

  const updateField = useCallback(
    (
      field: keyof CharacterFormData,
      value: string | EntityImage[] | CharacterAttribute[],
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
    setFormData(createInitialFormData(character, images, attributes))
  }, [character, images, attributes])

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
