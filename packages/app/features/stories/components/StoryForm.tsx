'use client'

import { useCallback } from 'react'
import type { StoryFormData } from '../hooks/useStoryEdit'
import {
  FormWrapper,
  FormField,
  Label,
  Input,
  Textarea,
  ButtonGroup,
  Button,
} from './StoryForm.styles'

export interface StoryFormProps {
  formData: StoryFormData
  onChange: (field: keyof StoryFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
  isSaving?: boolean
}

export function StoryForm({
  formData,
  onChange,
  onSave,
  onCancel,
  theme,
  isSaving = false,
}: StoryFormProps) {
  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange('name', event.target.value)
    },
    [onChange],
  )

  const handleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange('description', event.target.value)
    },
    [onChange],
  )

  const handleContentChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange('content', event.target.value)
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
        <Label htmlFor="story-name" $theme={theme} $required>
          Name
        </Label>
        <Input
          id="story-name"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="Enter story name"
          $theme={theme}
          required
          data-testid="story-name-input"
        />
      </FormField>

      <FormField>
        <Label htmlFor="story-description" $theme={theme}>
          Description
        </Label>
        <Input
          id="story-description"
          type="text"
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Enter story description (optional)"
          $theme={theme}
          data-testid="story-description-input"
        />
      </FormField>

      <FormField>
        <Label htmlFor="story-content" $theme={theme} $required>
          Content
        </Label>
        <Textarea
          id="story-content"
          value={formData.content}
          onChange={handleContentChange}
          placeholder="Enter story content"
          $theme={theme}
          required
          data-testid="story-content-input"
        />
      </FormField>

      <ButtonGroup>
        <Button
          type="button"
          $variant="secondary"
          $theme={theme}
          onClick={onCancel}
          data-testid="cancel-button"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          $variant="primary"
          $theme={theme}
          data-testid="save-button"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </ButtonGroup>
    </FormWrapper>
  )
}
