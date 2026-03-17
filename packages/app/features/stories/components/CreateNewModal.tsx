'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import { Sparkles } from 'lucide-react'
import { useCreateNewModal } from './useCreateNewModal'
import { GenerateEntityForm } from '../../shared/components/GenerateEntityForm'
import type { GenerateEntityResponse } from '../../../../../apps/next/lib/ai/types'

interface CreateNewModalProps {
  isOpen: boolean
  entityType: 'character' | 'location' | 'timeline'
  userId?: string
  onClose: () => void
  onCreate: (data: { name: string; description: string }) => void
}

export function CreateNewModal({
  isOpen,
  entityType,
  userId,
  onClose,
  onCreate,
}: CreateNewModalProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [isGenerateMode, setIsGenerateMode] = useState(false)

  const {
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
  } = useCreateNewModal({
    entityType,
    onCreate,
    onClose,
  })

  useEffect(() => {
    if (isOpen) {
      resetForm()
      setIsGenerateMode(false)
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 0)
    }
  }, [isOpen, resetForm])

  const handleGenerated = (result: GenerateEntityResponse) => {
    handleNameChange({
      target: { value: result.name },
    } as React.ChangeEvent<HTMLInputElement>)
    handleDescriptionChange({
      target: { value: result.description },
    } as React.ChangeEvent<HTMLTextAreaElement>)
    setIsGenerateMode(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="create-new-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New {capitalizedEntityType}</DialogTitle>
            {!isGenerateMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setIsGenerateMode(true)}
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                Generate with AI
              </Button>
            )}
          </div>
        </DialogHeader>

        {isGenerateMode ? (
          <GenerateEntityForm
            entityType={entityType}
            userId={userId}
            onGenerated={handleGenerated}
            onCancel={() => setIsGenerateMode(false)}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                ref={nameInputRef}
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                onKeyDown={handleNameKeyDown}
                placeholder="Enter name"
              />
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter description (optional)"
                className="max-h-[120px] min-h-[80px] resize-y"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleSubmit}
                disabled={!isValid}
              >
                Create and Link
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
