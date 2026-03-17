'use client'

import { useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import { Button } from '@repo/ui/components/ui/button'
import { ModalActions } from './UnsavedChangesModal.styles'

export interface UnsavedChangesModalProps {
  isOpen: boolean
  onSave?: () => void
  onDiscard: () => void
  onStay: () => void
}

export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onStay,
}: UnsavedChangesModalProps) {
  const handleEscapeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      onStay()
    },
    [onStay],
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onStay()
      }
    },
    [onStay],
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={handleEscapeKeyDown}
        data-testid="unsaved-changes-modal"
      >
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <ModalActions>
          <Button
            variant="outline"
            onClick={onStay}
            aria-label="Keep editing and stay on this page"
          >
            Keep Editing
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
            aria-label="Discard unsaved changes and navigate away"
          >
            Discard Changes
          </Button>
          {onSave && (
            <Button
              variant="default"
              onClick={onSave}
              aria-label="Save changes before navigating away"
            >
              Save Changes
            </Button>
          )}
        </ModalActions>
      </DialogContent>
    </Dialog>
  )
}
