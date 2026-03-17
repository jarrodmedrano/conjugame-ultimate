'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import { Check, Pencil, Trash2, Key, Loader2 } from 'lucide-react'
import { useApiKeys, type Provider } from '../hooks/useApiKeys'

const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
}

const ALL_PROVIDERS: Provider[] = ['anthropic', 'openai']

export function ApiKeysSection() {
  const { keys, isLoading, isSaving, saveKey, removeKey, error } = useApiKeys()
  const [selectedProvider, setSelectedProvider] =
    useState<Provider>('anthropic')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDeleteProvider, setConfirmDeleteProvider] =
    useState<Provider | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const keyInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!apiKeyInput.trim()) return
    setFormError(null)
    try {
      await saveKey(selectedProvider, apiKeyInput.trim())
      setApiKeyInput('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save key')
    }
  }

  const handleEditClick = (provider: Provider) => {
    setSelectedProvider(provider)
    setApiKeyInput('')
    keyInputRef.current?.focus()
    keyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleDeleteClick = (provider: Provider) => {
    setConfirmDeleteProvider(provider)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteProvider) return
    setIsDeleting(true)
    try {
      await removeKey(confirmDeleteProvider)
    } catch {
      // error shown via hook
    } finally {
      setIsDeleting(false)
      setConfirmDeleteProvider(null)
    }
  }

  const configuredProviders = keys.map((k) => k.provider)

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">AI Generation</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Add your own API key to unlock AI content generation. Your key is
          encrypted and never shared.
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <>
          {ALL_PROVIDERS.map((provider) => {
            const entry = keys.find((k) => k.provider === provider)
            return (
              <div
                key={provider}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {entry ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Key className="text-muted-foreground h-4 w-4" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {PROVIDER_LABELS[provider]}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {entry ? entry.maskedKey : 'Not configured'}
                    </p>
                  </div>
                </div>
                {entry && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(provider)}
                      aria-label={`Edit ${PROVIDER_LABELS[provider]} key`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => handleDeleteClick(provider)}
                      aria-label={`Delete ${PROVIDER_LABELS[provider]} key`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      <div id="ai-keys" className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">
          {configuredProviders.length > 0 ? 'Update a key' : 'Add your API key'}
        </p>
        <div className="flex gap-2">
          <Select
            value={selectedProvider}
            onValueChange={(v) => setSelectedProvider(v as Provider)}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            ref={keyInputRef}
            type="password"
            placeholder="sk-..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="flex-1"
            aria-label="API key"
          />
          <Button
            onClick={handleSave}
            disabled={!apiKeyInput.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
        {(formError ?? error) && (
          <p className="text-destructive text-xs">{formError ?? error}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Your key is encrypted with AES-256-GCM and stored securely. We never
          log or expose it.
        </p>
      </div>

      <Dialog
        open={confirmDeleteProvider !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteProvider(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API key</DialogTitle>
            <DialogDescription>
              {confirmDeleteProvider &&
                `Remove your ${PROVIDER_LABELS[confirmDeleteProvider]} key? AI features using this provider will stop working until you add a new key.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteProvider(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
