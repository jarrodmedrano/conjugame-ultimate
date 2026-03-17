'use client'

import type { LocationAttribute } from '@repo/database'
import {
  EntityAttributeEditor,
  type BaseAttribute,
} from '../../shared/components/EntityAttributeEditor'
import {
  PREDEFINED_ATTRIBUTES,
  getLabelForKey,
} from '../constants/locationAttributes'

interface LocationAttributeEditorProps {
  locationId: number
  attributes: LocationAttribute[]
  onAttributesChange: (attributes: LocationAttribute[]) => void
  theme?: string
  disabled?: boolean
}

export function LocationAttributeEditor({
  locationId,
  attributes,
  onAttributesChange,
  theme,
  disabled = false,
}: LocationAttributeEditorProps) {
  const handleChange = (updated: BaseAttribute[]) => {
    onAttributesChange(updated as LocationAttribute[])
  }

  return (
    <EntityAttributeEditor
      entityId={locationId}
      apiPath="/api/location"
      attributes={attributes}
      onAttributesChange={handleChange}
      predefinedAttributes={PREDEFINED_ATTRIBUTES}
      getLabelForKey={getLabelForKey}
      theme={theme}
      disabled={disabled}
    />
  )
}
