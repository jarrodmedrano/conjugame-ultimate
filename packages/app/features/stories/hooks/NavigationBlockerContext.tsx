'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'

interface NavigationBlocker {
  id: string
  shouldBlock: () => boolean
  onBlock: (e: { preventDefault: () => void }) => boolean
}

interface NavigationBlockerContextValue {
  registerBlocker: (blocker: NavigationBlocker) => void
  unregisterBlocker: (id: string) => void
  checkNavigation: (e: { preventDefault: () => void }) => boolean
}

const NavigationBlockerContext = createContext<
  NavigationBlockerContextValue | undefined
>(undefined)

export function NavigationBlockerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [blockers, setBlockers] = useState<Map<string, NavigationBlocker>>(
    new Map(),
  )

  const registerBlocker = useCallback((blocker: NavigationBlocker) => {
    setBlockers((prev) => {
      const next = new Map(prev)
      next.set(blocker.id, blocker)
      return next
    })
  }, [])

  const unregisterBlocker = useCallback((id: string) => {
    setBlockers((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const checkNavigation = useCallback(
    (e: { preventDefault: () => void }) => {
      const blockerArray = Array.from(blockers.values())
      for (const blocker of blockerArray) {
        if (blocker.shouldBlock()) {
          const allowed = blocker.onBlock(e)
          if (!allowed) {
            return false
          }
        }
      }
      return true
    },
    [blockers],
  )

  const value = useMemo(
    () => ({
      registerBlocker,
      unregisterBlocker,
      checkNavigation,
    }),
    [registerBlocker, unregisterBlocker, checkNavigation],
  )

  return (
    <NavigationBlockerContext.Provider value={value}>
      {children}
    </NavigationBlockerContext.Provider>
  )
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext)
  if (!context) {
    throw new Error(
      'useNavigationBlocker must be used within NavigationBlockerProvider',
    )
  }
  return context
}
