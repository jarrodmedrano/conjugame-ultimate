'use client'

import { useState } from 'react'
import { Pencil, Globe, Lock, X } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@repo/ui/components/ui/tooltip'
import { ConfirmDialog } from './ConfirmDialog'
import type { EntityActionsProps } from './EntityActions.types'

export function EntityActions({
  onEdit,
  onDelete,
  onTogglePrivacy,
  privacy,
  entityName,
  entityType,
}: EntityActionsProps) {
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isPublic = privacy === 'public'
  const privacyAction = isPublic ? 'private' : 'public'

  return (
    <TooltipProvider>
      <div
        className="flex items-center gap-2"
        data-testid={`${entityType}-action-buttons`}
      >
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onEdit}
                variant="ghost"
                size="icon"
                data-testid="edit-button"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit {entityType}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onTogglePrivacy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowPrivacyDialog(true)}
                variant="ghost"
                size="icon"
                data-testid="toggle-privacy-button"
                aria-label={`Make ${privacyAction}`}
              >
                {isPublic ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Make {privacyAction}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                size="icon"
                data-testid="delete-button"
                aria-label="Delete"
              >
                <X className="h-4 w-4 text-red-600 dark:text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete {entityType}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Privacy Confirmation Dialog */}
      {onTogglePrivacy && (
        <ConfirmDialog
          isOpen={showPrivacyDialog}
          onClose={() => setShowPrivacyDialog(false)}
          onConfirm={onTogglePrivacy}
          title={`Make ${entityName} ${privacyAction}?`}
          description={
            isPublic
              ? `This ${entityType} will no longer be visible to other users.`
              : `This ${entityType} will be visible to all users on the platform.`
          }
          confirmLabel={`Make ${privacyAction}`}
          variant="default"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {onDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={onDelete}
          title={`Delete ${entityName}?`}
          description={`This action cannot be undone. This will permanently delete this ${entityType} and all associated data.`}
          confirmLabel="Delete"
          variant="destructive"
        />
      )}
    </TooltipProvider>
  )
}
