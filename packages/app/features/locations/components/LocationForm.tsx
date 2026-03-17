'use client'

import { useCallback } from 'react'
import type { LocationFormData } from '../hooks/useLocationEdit'
import {
  FormWrapper,
  FormField,
  Label,
  Input,
  Textarea,
  ButtonGroup,
  Button,
} from './LocationForm.styles'

export interface LocationFormProps {
  formData: LocationFormData
  onChange: (field: keyof LocationFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
}

export function LocationForm({
  formData,
  onChange,
  onSave,
  onCancel,
  theme,
}: LocationFormProps) {
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
        <Label htmlFor="location-name" $theme={theme} $required>
          Name
        </Label>
        <Input
          id="location-name"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="Enter location name"
          $theme={theme}
          required
        />
      </FormField>

      <FormField>
        <Label htmlFor="location-description" $theme={theme}>
          Description
        </Label>
        <Textarea
          id="location-description"
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Enter location description"
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
