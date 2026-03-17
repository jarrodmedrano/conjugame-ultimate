'use client'

import Link from 'next/link'
import { ComponentProps, useCallback } from 'react'
import { useNavigationBlocker } from '../hooks/NavigationBlockerContext'

type LinkProps = ComponentProps<typeof Link>

export function GuardedLink({ children, ...props }: LinkProps) {
  const { checkNavigation } = useNavigationBlocker()

  const handleNavigate = useCallback(
    (e: { preventDefault: () => void }) => {
      const allowed = checkNavigation(e)
      if (!allowed) {
        e.preventDefault()
      }

      if (props.onNavigate) {
        props.onNavigate(e)
      }
    },
    [checkNavigation, props],
  )

  return (
    <Link {...props} onNavigate={handleNavigate}>
      {children}
    </Link>
  )
}
