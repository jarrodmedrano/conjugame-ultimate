import {
  useState,
  useCallback,
  useMemo,
  ChangeEvent,
  KeyboardEvent,
} from 'react'

interface UseCreateNewModalProps {
  entityType: 'character' | 'location' | 'timeline'
  onCreate: (data: { name: string; description: string }) => void
  onClose: () => void
}

export function useCreateNewModal({
  entityType,
  onCreate,
  onClose,
}: UseCreateNewModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const isValid = name.trim().length > 0

  const capitalizedEntityType = useMemo(() => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1)
  }, [entityType])

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleDescriptionChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value)
    },
    [],
  )

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
  }, [])

  const handleSubmit = useCallback(() => {
    if (!isValid) {
      return
    }

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    onCreate({
      name: trimmedName,
      description: trimmedDescription,
    })

    resetForm()
    onClose()
  }, [name, description, isValid, onCreate, onClose, resetForm])

  const handleCancel = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleNameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const descriptionElement = document.getElementById('description')
        if (descriptionElement) {
          descriptionElement.focus()
        }
      }
    },
    [],
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose()
      }
    },
    [onClose],
  )

  return {
    name,
    description,
    isValid,
    capitalizedEntityType,
    handleNameChange,
    handleDescriptionChange,
    handleSubmit,
    handleCancel,
    handleNameKeyDown,
    handleOpenChange,
    resetForm,
  }
}
