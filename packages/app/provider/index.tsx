import { SafeArea } from './safe-area'
import { Providers } from '../theme'
import { NavigationBlockerProvider } from '../features/stories/hooks/NavigationBlockerContext'

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SafeArea>
      <Providers>
        <NavigationBlockerProvider>{children}</NavigationBlockerProvider>
      </Providers>
    </SafeArea>
  )
}
