'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export interface BaseAttribute {
  id: number
  key: string
  value: string | null
  displayOrder?: number | null
}

interface EntityAttributeEditorProps {
  entityId: number
  apiPath: string
  attributes: BaseAttribute[]
  onAttributesChange: (attributes: BaseAttribute[]) => void
  predefinedAttributes: ReadonlyArray<{ key: string; label: string }>
  getLabelForKey: (key: string) => string
  theme?: string
  disabled?: boolean
}

export function EntityAttributeEditor({
  entityId,
  apiPath,
  attributes,
  onAttributesChange,
  predefinedAttributes,
  getLabelForKey,
  theme,
  disabled = false,
}: EntityAttributeEditorProps) {
  const isDark = theme === 'dark'
  const [isAdding, setIsAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isCustomKey, setIsCustomKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  const existingKeys = new Set(attributes.map((a) => a.key))

  const availablePredefined = predefinedAttributes.filter(
    (opt) => !existingKeys.has(opt.key),
  )

  const handleAddAttribute = async () => {
    const key = isCustomKey
      ? newKey.trim().toLowerCase().replace(/\s+/g, '_')
      : newKey
    if (!key || !newValue.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${apiPath}/${entityId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save attribute')
      }

      const saved: BaseAttribute = await response.json()
      onAttributesChange([...attributes, saved])
      setNewKey('')
      setNewValue('')
      setIsAdding(false)
      setIsCustomKey(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attribute')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAttribute = async (attributeId: number) => {
    setError(null)
    setDeletingIds((prev) => new Set(prev).add(attributeId))
    try {
      const response = await fetch(
        `${apiPath}/${entityId}/attributes?id=${attributeId}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete attribute')
      }

      onAttributesChange(attributes.filter((a) => a.id !== attributeId))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete attribute',
      )
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(attributeId)
        return next
      })
    }
  }

  const handleLocalValueChange =
    (attribute: BaseAttribute) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onAttributesChange(
        attributes.map((a) =>
          a.id === attribute.id ? { ...a, value: e.target.value } : a,
        ),
      )
    }

  const handleValueBlur = (attribute: BaseAttribute) => async () => {
    const currentValue =
      attributes.find((a) => a.id === attribute.id)?.value ?? ''
    setError(null)
    try {
      const response = await fetch(`${apiPath}/${entityId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: attribute.key, value: currentValue }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update attribute')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update attribute',
      )
    }
  }

  const handleToggleCustomKey = () => {
    setIsCustomKey(!isCustomKey)
    setNewKey('')
  }

  const handleCancelAdding = () => {
    setIsAdding(false)
    setNewKey('')
    setNewValue('')
    setIsCustomKey(false)
  }

  const handleStartAdding = () => {
    setIsAdding(true)
  }

  const handleNewKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewKey(e.target.value)
  }

  const handleNewValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue(e.target.value)
  }

  const handleSelectKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewKey(e.target.value)
  }

  const handleValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAttribute()
    }
    if (e.key === 'Escape') {
      handleCancelAdding()
    }
  }

  const handleDeleteClick = (attributeId: number) => () => {
    handleDeleteAttribute(attributeId)
  }

  const inputClasses = `w-full px-2 py-1.5 text-sm rounded border ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50`

  return (
    <div data-testid="attribute-editor">
      {attributes.length > 0 && (
        <div className="mb-3 space-y-2">
          {attributes.map((attr) => (
            <div key={attr.id} className="flex items-center gap-2">
              <span
                className={`w-28 shrink-0 text-xs font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {getLabelForKey(attr.key)}
              </span>
              <input
                type="text"
                className={inputClasses}
                value={attr.value ?? ''}
                onChange={handleLocalValueChange(attr)}
                onBlur={handleValueBlur(attr)}
                disabled={disabled}
                placeholder="Enter value"
              />
              <button
                type="button"
                aria-label={`Delete ${getLabelForKey(attr.key)}`}
                onClick={handleDeleteClick(attr.id)}
                disabled={disabled || deletingIds.has(attr.id)}
                className="shrink-0 rounded p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      {isAdding ? (
        <div className="space-y-2 rounded border border-dashed border-gray-400 p-3">
          <div className="flex gap-2">
            {!isCustomKey && availablePredefined.length > 0 ? (
              <select
                className={`${inputClasses} flex-1`}
                value={newKey}
                onChange={handleSelectKeyChange}
                disabled={disabled || isSaving}
              >
                <option value="">Select attribute...</option>
                {availablePredefined.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className={`${inputClasses} flex-1`}
                placeholder="Custom attribute name"
                value={newKey}
                onChange={handleNewKeyChange}
                disabled={disabled || isSaving}
              />
            )}
            <button
              type="button"
              onClick={handleToggleCustomKey}
              className={`rounded border px-2 py-1 text-xs ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              disabled={disabled || isSaving}
            >
              {isCustomKey ? 'Predefined' : 'Custom'}
            </button>
          </div>

          <input
            type="text"
            className={inputClasses}
            placeholder="Value"
            value={newValue}
            onChange={handleNewValueChange}
            onKeyDown={handleValueKeyDown}
            disabled={disabled || isSaving}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelAdding}
              className={`rounded px-3 py-1.5 text-xs ${
                isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              disabled={disabled || isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddAttribute}
              disabled={!newKey || !newValue.trim() || disabled || isSaving}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStartAdding}
          disabled={disabled}
          className={`flex items-center gap-1.5 rounded border border-dashed px-3 py-1.5 text-xs ${
            isDark
              ? 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
              : 'border-gray-400 text-gray-500 hover:border-gray-600 hover:text-gray-700'
          } transition-colors disabled:opacity-50`}
          data-testid="add-attribute-button"
        >
          <Plus className="h-3 w-3" />
          Add attribute
        </button>
      )}
    </div>
  )
}
