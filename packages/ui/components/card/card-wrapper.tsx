'use client'

import {
  CardContent,
  CardFooter,
  CardHeader,
} from '@repo/ui/components/ui/card'
import { Header } from './header'
import { BackButton } from './back-button'

interface CardWrapperProps {
  children: React.ReactNode
  headerLabel: string
  backButtonLabel: string
  backButtonHref: string
  showSocial?: boolean
  slim?: boolean
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  slim,
}: CardWrapperProps) => {
  return (
    <>
      <CardHeader>
        <Header
          label={headerLabel}
          backButtonHref={backButtonHref}
          backButtonLabel={backButtonLabel}
        />
      </CardHeader>
      <div className="mb-10 mt-2 sm:mx-auto sm:w-full sm:max-w-[480px]">
        {slim && <CardContent>{children}</CardContent>}
        {!slim && (
          <div className="shadow-xs border border-gray-200 bg-white px-6 py-12 sm:rounded-lg sm:px-12 dark:border-gray-700 dark:bg-gray-800">
            <CardContent>{children}</CardContent>
          </div>
        )}
      </div>
      <CardFooter>
        <BackButton label={backButtonLabel} href={backButtonHref} />
      </CardFooter>
    </>
  )
}
