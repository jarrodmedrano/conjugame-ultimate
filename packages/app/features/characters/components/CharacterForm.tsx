'use client'

import { useCallback } from 'react'
import type { CharacterFormData } from '../hooks/useCharacterEdit'
import {
  FormWrapper,
  FormField,
  Label,
  Input,
  Textarea,
  ButtonGroup,
  Button,
} from './CharacterForm.styles'

export interface CharacterFormProps {
  formData: CharacterFormData
  onChange: (field: keyof CharacterFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
}

export function CharacterForm({
  formData,
  onChange,
  onSave,
  onCancel,
  theme,
}: CharacterFormProps) {
  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange('name', event.target.value)
    },
    [onChange],
  )

  const handleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange('description', event.target.value)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }

      if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
        event.preventDefault()
        onSave()
      }
    },
    [onCancel, onSave],
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      onSave()
    },
    [onSave],
  )

  return (
    <FormWrapper
      $theme={theme}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <FormField>
        <Label htmlFor="character-name" $theme={theme} $required>
          Name
        </Label>
        <Input
          id="character-name"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="Enter character name"
          $theme={theme}
          required
        />
      </FormField>

      <FormField>
        <Label htmlFor="character-description" $theme={theme}>
          Description
        </Label>
        <Textarea
          id="character-description"
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Enter character description"
          $theme={theme}
        />
      </FormField>

      <ButtonGroup>
        <Button
          type="button"
          $variant="secondary"
          $theme={theme}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" $variant="primary" $theme={theme}>
          Save
        </Button>
      </ButtonGroup>
    </FormWrapper>
  )
}
