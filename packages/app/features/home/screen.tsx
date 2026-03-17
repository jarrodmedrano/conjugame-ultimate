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
        title={`Master Verb Conjugation`}
        description="Learn to conjugate verbs in Spanish, English, and Portuguese with interactive quizzes. Track your progress, compete on the leaderboard, and master a new language one verb at a time."
        navigation={navigation}
        buttonLink={'/quiz'}
        buttonText={'Start Quizzing'}
        altButtonLink={'/leaderboard'}
        altButtonText={'View Leaderboard'}
        heroButtonAltText={'See all verbs'}
        heroButtonText={'Browse Verbs'}
        heroButtonLink={'/verbs'}
        companyName="Conjugame"
        companyLogo={<Logo className="h-8 w-auto" />}
        companyLink={'/quiz'}
      />
      <FeatureList />
      <Feature />
      <Footer />
    </View>
  )
}
