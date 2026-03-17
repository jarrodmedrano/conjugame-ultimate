// import '../src/styles/global.css'
import { PublicEnvProvider } from 'next-runtime-env'
import { Provider } from '@app/provider'
import '@repo/ui/styles/globals.css'
import { Metadata } from 'next'
import GoogleAnalytics from './GoogleAnalytics'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { CookiesProvider } from 'next-client-cookies/server'
import { Toaster } from '@repo/ui/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Conjugame',
  description: 'Master verb conjugation with interactive quizzes',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default async function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages({
    locale,
  })

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <NextIntlClientProvider messages={messages}>
          <GoogleAnalytics />
          <PublicEnvProvider>
            <Provider>
              <CookiesProvider>{children}</CookiesProvider>
              <Toaster />
            </Provider>
          </PublicEnvProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
