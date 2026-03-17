'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { useCookies } from 'next-client-cookies'
import { TooltipProvider } from '@repo/ui/components/ui/tooltip'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@repo/ui/components/ui/resizable'
import type { ImperativePanelHandle } from 'react-resizable-panels'
import { cn } from '@repo/ui/lib/utils'
import styles from './DashboardLayout.module.css'
import { SiteHeader } from '@repo/ui/components/header/internal/site-header'
import { Sidebar } from '@repo/ui/components/dashboard/sidebar/sidebar'
import { authClient } from '../lib/auth-client'
import type { User } from '@auth/core/types'
import type { SidebarSection } from '@repo/ui/components/dashboard/sidebar-nav'

interface DashboardLayoutProps {
  children: React.ReactNode
  sections: SidebarSection[]
}

export function DashboardLayout({ children, sections }: DashboardLayoutProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const user = session?.user as User | undefined
  const cookies = useCookies()

  const signOut = async () => {
    await authClient.signOut()
    if (typeof window !== 'undefined') {
      window.location.href = '/signin'
    }
  }

  // State to track whether the component has mounted
  const [hasMounted, setHasMounted] = useState(false)

  // State for layout and collapsed status
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [layout, setLayout] = useState<number[]>([50, 50])
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)

  useEffect(() => {
    // Set initial state based on cookies after the component has mounted
    try {
      const defaultLayout = cookies.get('react-resizable-panels:layout')
      const defaultCollapsed = cookies.get('react-resizable-panels:collapsed')

      setIsCollapsed(defaultCollapsed === 'true')
      setLayout(defaultLayout ? JSON.parse(defaultLayout) : [50, 50])
    } catch (_error) {
      // Use defaults if cookies are not available
      setLayout([50, 50])
    }

    // Mark the component as mounted
    setHasMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768
      if (isSmallScreen && !isCollapsed) {
        sidebarPanelRef.current?.collapse()
      }
    }

    // Check on mount
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isCollapsed])

  const handleCollapse = () => {
    if (!isCollapsed) {
      setIsCollapsed(true)
      try {
        cookies.set('react-resizable-panels:collapsed', 'true')
      } catch (_error) {
        // Ignore cookie errors
      }
    }
  }

  const handleExpand = () => {
    if (isCollapsed) {
      setIsCollapsed(false)
      try {
        cookies.set('react-resizable-panels:collapsed', 'false')
      } catch (_error) {
        // Ignore cookie errors
      }
    }
  }

  // Expand the sidebar panel programmatically (for when clicking on collapsed section headers)
  const expandSidebarPanel = useCallback(() => {
    sidebarPanelRef.current?.expand()
  }, [])

  const handleLayout = (sizes: number[]) => {
    try {
      cookies.set('react-resizable-panels:layout', JSON.stringify(sizes))
    } catch (_error) {
      // Ignore cookie errors
    }
  }

  // Avoid rendering the component until it has mounted or session is still loading
  if (!hasMounted || isSessionPending) {
    return null
  }

  return (
    <>
      <SiteHeader
        user={user}
        cookies={cookies}
        signOut={signOut}
        theme={theme}
        resolvedTheme={resolvedTheme}
        setTheme={setTheme}
      />
      <main className="h-screen flex-1">
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={handleLayout}
            className="h-full items-stretch"
          >
            <ResizablePanel
              ref={sidebarPanelRef}
              className={cn(
                isCollapsed
                  ? layout[0] <= 5
                    ? 'min-w-[50px] max-w-[50px] transition-all duration-300 ease-in-out'
                    : 'min-w-[50px] transition-all duration-300 ease-in-out'
                  : styles.sidebarOverflowAuto,
              )}
              collapsedSize={5}
              collapsible={true}
              defaultSize={layout[0]}
              maxSize={20}
              minSize={15}
              onCollapse={handleCollapse}
              onExpand={handleExpand}
            >
              <Sidebar
                defaultLayout={layout}
                isCollapsed={isCollapsed}
                sections={sections}
                theme={resolvedTheme}
                onExpand={expandSidebarPanel}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={layout[1]}
              minSize={30}
              className={styles.mainContentOverflowAuto}
            >
              {children}
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      </main>
    </>
  )
}
