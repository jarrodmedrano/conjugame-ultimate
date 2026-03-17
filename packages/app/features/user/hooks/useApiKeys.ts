import { useState, useEffect, useCallback } from 'react'

export type Provider = 'anthropic' | 'openai'

export interface ApiKeyEntry {
  provider: Provider
  maskedKey: string
  createdAt: string
}

interface UseApiKeysResult {
  keys: ApiKeyEntry[]
  isLoading: boolean
  isSaving: boolean
  saveKey: (provider: Provider, apiKey: string) => Promise<void>
  removeKey: (provider: Provider) => Promise<void>
  error: string | null
}

export function useApiKeys(): UseApiKeysResult {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/api-keys')
      if (!response.ok) throw new Error('Failed to load API keys')
      const data = (await response.json()) as ApiKeyEntry[]
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const saveKey = useCallback(async (provider: Provider, apiKey: string) => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save API key')
      }
      const saved = (await response.json()) as {
        provider: Provider
        maskedKey: string
      }
      setKeys((prev) => {
        const filtered = prev.filter((k) => k.provider !== saved.provider)
        return [
          ...filtered,
          {
            provider: saved.provider,
            maskedKey: saved.maskedKey,
            createdAt: new Date().toISOString(),
          },
        ]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  const removeKey = useCallback(async (provider: Provider) => {
    setError(null)
    try {
      const response = await fetch(`/api/user/api-keys/${provider}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove API key')
      setKeys((prev) => prev.filter((k) => k.provider !== provider))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key')
      throw err
    }
  }, [])

  return { keys, isLoading, isSaving, saveKey, removeKey, error }
}
