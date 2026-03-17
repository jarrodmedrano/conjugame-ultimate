'use client'

import { useTheme } from 'next-themes'
import { SiteHeader } from '@repo/ui/components/header/internal/site-header'
import { User } from '@auth/core/types'
import { Cookies } from 'next-client-cookies/dist'

export function SiteHeaderWrapper({
  user,
  signOut,
  cookies,
}: {
  user: User
  signOut: () => Promise<void>
  cookies: Cookies
}) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <SiteHeader
      user={user}
      signOut={signOut}
      cookies={cookies}
      theme={theme}
      resolvedTheme={resolvedTheme}
      setTheme={setTheme}
    />
  )
}
