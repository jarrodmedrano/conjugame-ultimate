'use client'
import React from 'react'
import { View } from '../../../design/view'
import { Footer } from '@repo/ui/components/tailwind/footer'
import { Contact } from '@repo/ui/components/tailwind/contact'
import { Header } from '../../../components/header'
import { useCookies } from 'next-client-cookies'

export function ContactScreen() {
  const cookies = useCookies()

  // Public page - always use dark mode for header/logo
  return (
    <View>
      <Header cookies={cookies} />
      <Contact />
      <Footer />
    </View>
  )
}
