'use client'

import { View } from '../../design/view'
import { Hero } from '@repo/ui/components/tailwind/hero'
import { Header } from '../../components/header'
import { Footer } from '@repo/ui/components/tailwind/footer'
import { Feature } from '@repo/ui/components/tailwind/feature'
import { FeatureList } from '@repo/ui/components/tailwind/featurelist'
import { useCookies } from 'next-client-cookies'

import '@repo/ui/styles/globals.css'
import { Logo } from '@repo/ui/components/icons/logo'
import { navigation } from '../../utils/constants'

export function HomeScreen() {
  const cookies = useCookies()

  // Public page - always use dark mode for header/logo
  return (
    <View>
      <Header cookies={cookies} />
      <Hero
        title={`Your AI-Powered Story Bible`}
        description="Build living, wiki-style story bibles with AI assistance. Craft rich characters, immersive locations, and intricate timelines. All in one place, for less than a cup of coffee a month."
        navigation={navigation}
        buttonLink={'/register'}
        buttonText={'Start for free'}
        altButtonLink={'/about/features'}
        altButtonText={'See all features'}
        heroButtonAltText={'See how it works'}
        heroButtonText={'New: AI story assistant'}
        heroButtonLink={'/about/features'}
        companyName="Story Bible"
        companyLogo={<Logo className="h-8 w-auto" />}
        companyLink={'/create'}
      />
      <FeatureList />
      <Feature />
      <Footer />
    </View>
  )
}
