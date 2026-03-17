'use client'
import { View } from '../../../design/view'
import { Footer } from '@repo/ui/components/tailwind/footer'
import { Pricing } from '@repo/ui/components/tailwind/pricing'
import { Header } from '../../../components/header'
import { useCookies } from 'next-client-cookies'

export function PricingScreen() {
  const cookies = useCookies()

  // Public page - always use dark mode for header/logo
  return (
    <View>
      <Header cookies={cookies} />
      <Pricing />
      <Footer />
    </View>
  )
}
