'use client'

import { useCallback } from 'react'
import type { TimelineFormData } from '../hooks/useTimelineEdit'
import {
  FormWrapper,
  FormField,
  Label,
  Input,
  Textarea,
  ButtonGroup,
  Button,
} from './TimelineForm.styles'

export interface TimelineFormProps {
  formData: TimelineFormData
  onChange: (field: keyof TimelineFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
}

export function TimelineForm({
  formData,
  onChange,
  onSave,
  onCancel,
  theme,
}: TimelineFormProps) {
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
        <Label htmlFor="timeline-name" $theme={theme} $required>
          Name
        </Label>
        <Input
          id="timeline-name"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="Enter timeline name"
          $theme={theme}
          required
        />
      </FormField>

      <FormField>
        <Label htmlFor="timeline-description" $theme={theme}>
          Description
        </Label>
        <Textarea
          id="timeline-description"
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Enter timeline description"
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
