import React, { ElementType, ReactNode, useEffect, useState } from 'react'
import { TooltipProvider } from '../ui/tooltip'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable'
import { cn } from '@repo/ui/lib/utils'
import { SiteHeader } from '../header/internal/site-header'
import { Sidebar } from './sidebar/sidebar'
import { useCookies } from 'next-client-cookies'

const withDashboard = (Component: ElementType<any>) => {
  const WrappedComponent = ({
    children,
    ...props
  }: {
    children: ReactNode
  }) => {
    //@ts-ignore this line
    const {
      //@ts-ignore this line
      data,
      //@ts-ignore this line
      user,
      //@ts-ignore this line
      signOut,
      //@ts-ignore this line
      theme,
      //@ts-ignore this line
      resolvedTheme,
      //@ts-ignore this line
      setTheme,
    } = props

    let cookies: ReturnType<typeof useCookies>
    try {
      cookies = useCookies()
    } catch (error) {
      // Fallback if CookiesProvider is not available
      cookies = {
        get: (() => null) as any,
        set: () => {},
        remove: () => {},
      } as ReturnType<typeof useCookies>
    }

    // State to track whether the component has mounted
    const [hasMounted, setHasMounted] = useState(false)

    // State for layout and collapsed status
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
    const [layout, setLayout] = useState<number[]>([50, 50])

    useEffect(() => {
      // Set initial state based on cookies after the component has mounted
      try {
        const defaultLayout = cookies.get('react-resizable-panels:layout')
        const defaultCollapsed = cookies.get('react-resizable-panels:collapsed')

        setIsCollapsed(defaultCollapsed === 'true')
        setLayout(defaultLayout ? JSON.parse(defaultLayout) : [50, 50])
      } catch (error) {
        // Use defaults if cookies are not available
        setLayout([50, 50])
      }

      // Mark the component as mounted
      setHasMounted(true)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCollapse = () => {
      if (!isCollapsed) {
        setIsCollapsed(true)
        try {
          cookies.set('react-resizable-panels:collapsed', 'true')
        } catch (error) {
          // Ignore cookie errors
        }
      }
    }

    const handleExpand = () => {
      if (isCollapsed) {
        setIsCollapsed(false)
        try {
          cookies.set('react-resizable-panels:collapsed', 'false')
        } catch (error) {
          // Ignore cookie errors
        }
      }
    }

    const handleLayout = (sizes: number[]) => {
      try {
        cookies.set('react-resizable-panels:layout', JSON.stringify(sizes))
      } catch (error) {
        // Ignore cookie errors
      }
    }

    // Avoid rendering the component until it has mounted
    if (!hasMounted) {
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
                className={cn(
                  isCollapsed &&
                    'min-w-[50px] transition-all duration-300 ease-in-out',
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
                  data={data}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={layout[1]} minSize={30}>
                <Component {...props} isCollapsed={isCollapsed} />
                {children}
              </ResizablePanel>
            </ResizablePanelGroup>
          </TooltipProvider>
        </main>
      </>
    )
  }

  return WrappedComponent
}

export default withDashboard
