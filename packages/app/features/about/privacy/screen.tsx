'use client'
import { View } from '../../../design/view'
import { Footer } from '@repo/ui/components/tailwind/footer'
import { Privacy } from '@repo/ui/components/tailwind/privacy'
import { Header } from '../../../components/header'
import { useCookies } from 'next-client-cookies'

export function PrivacyScreen() {
  const cookies = useCookies()

  return (
    <View>
      <Header cookies={cookies} />
      <Privacy />
      <Footer />
    </View>
  )
}
