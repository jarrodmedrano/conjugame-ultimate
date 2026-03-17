'use client'

import type { StoryAttribute } from '@repo/database'
import {
  EntityAttributeEditor,
  type BaseAttribute,
} from '../../shared/components/EntityAttributeEditor'
import {
  PREDEFINED_ATTRIBUTES,
  getLabelForKey,
} from '../constants/storyAttributes'

interface StoryAttributeEditorProps {
  storyId: number
  attributes: StoryAttribute[]
  onAttributesChange: (attributes: StoryAttribute[]) => void
  theme?: string
  disabled?: boolean
}

export function StoryAttributeEditor({
  storyId,
  attributes,
  onAttributesChange,
  theme,
  disabled = false,
}: StoryAttributeEditorProps) {
  const handleChange = (updated: BaseAttribute[]) => {
    onAttributesChange(updated as StoryAttribute[])
  }

  return (
    <EntityAttributeEditor
      entityId={storyId}
      apiPath="/api/story"
      attributes={attributes}
      onAttributesChange={handleChange}
      predefinedAttributes={PREDEFINED_ATTRIBUTES}
      getLabelForKey={getLabelForKey}
      theme={theme}
      disabled={disabled}
    />
  )
}
