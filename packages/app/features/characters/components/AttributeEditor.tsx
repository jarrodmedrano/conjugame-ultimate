'use client'

import type { CharacterAttribute } from '@repo/database'
import {
  EntityAttributeEditor,
  type BaseAttribute,
} from '../../shared/components/EntityAttributeEditor'
import {
  PREDEFINED_ATTRIBUTES,
  getLabelForKey,
} from '../constants/characterAttributes'

interface AttributeEditorProps {
  characterId: number
  attributes: CharacterAttribute[]
  onAttributesChange: (attributes: CharacterAttribute[]) => void
  theme?: string
  disabled?: boolean
}

export function AttributeEditor({
  characterId,
  attributes,
  onAttributesChange,
  theme,
  disabled = false,
}: AttributeEditorProps) {
  const handleChange = (updated: BaseAttribute[]) => {
    onAttributesChange(updated as CharacterAttribute[])
  }

  return (
    <EntityAttributeEditor
      entityId={characterId}
      apiPath="/api/character"
      attributes={attributes}
      onAttributesChange={handleChange}
      predefinedAttributes={PREDEFINED_ATTRIBUTES}
      getLabelForKey={getLabelForKey}
      theme={theme}
      disabled={disabled}
    />
  )
}
