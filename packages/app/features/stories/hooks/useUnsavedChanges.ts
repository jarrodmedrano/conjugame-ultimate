import { useState, useEffect, useCallback, useId, useRef } from 'react'
import { useNavigationBlocker } from './NavigationBlockerContext'

export interface UseUnsavedChangesArgs {
  isDirty: boolean
  onNavigate?: () => void
}

export interface UseUnsavedChangesReturn {
  showModal: boolean
  pendingNavigation: boolean
  confirmNavigation: () => void
  cancelNavigation: () => void
  handleRouteChange: (e: { preventDefault: () => void }) => boolean
}

export function useUnsavedChanges(
  args: UseUnsavedChangesArgs,
): UseUnsavedChangesReturn {
  const { isDirty, onNavigate } = args
  const blockerId = useId()
  const navigationBlocker = useNavigationBlocker()
  const navigationBlockerRef = useRef(navigationBlocker)
  navigationBlockerRef.current = navigationBlocker

  const [showModal, setShowModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(false)

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    },
    [isDirty],
  )

  useEffect(() => {
    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, handleBeforeUnload])

  const handleRouteChange = useCallback(
    (e: { preventDefault: () => void }) => {
      if (!isDirty) {
        return true
      }

      e.preventDefault()
      setShowModal(true)
      setPendingNavigation(true)

      return false
    },
    [isDirty],
  )

  // Use a ref to track isDirty for the blocker callback
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const handleRouteChangeRef = useRef(handleRouteChange)
  handleRouteChangeRef.current = handleRouteChange

  useEffect(() => {
    navigationBlockerRef.current.registerBlocker({
      id: blockerId,
      shouldBlock: () => isDirtyRef.current,
      onBlock: (e) => handleRouteChangeRef.current(e),
    })

    return () => {
      navigationBlockerRef.current.unregisterBlocker(blockerId)
    }
  }, [blockerId])

  const confirmNavigation = useCallback(() => {
    setShowModal(false)
    setPendingNavigation(false)

    if (onNavigate) {
      onNavigate()
    }
  }, [onNavigate])

  const cancelNavigation = useCallback(() => {
    setShowModal(false)
    setPendingNavigation(false)
  }, [])

  return {
    showModal,
    pendingNavigation,
    confirmNavigation,
    cancelNavigation,
    handleRouteChange,
  }
}
