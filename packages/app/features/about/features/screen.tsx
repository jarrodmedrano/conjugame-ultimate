'use client'
import React from 'react'
import { View } from '../../../design/view'
import { Footer } from '@repo/ui/components/tailwind/footer'
import { Features } from '@repo/ui/components/pages/features'
import { Header } from '../../../components/header'
import { useCookies } from 'next-client-cookies'

export function FeaturesScreen() {
  const cookies = useCookies()

  // Public page - always use dark mode for header/logo
  return (
    <View>
      <Header cookies={cookies} />
      <Features />
      <Footer />
    </View>
  )
}
