import { ReactNode } from 'react'

interface ContentPageProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: ReactNode
}

export function ContentPage({
  title,
  subtitle,
  lastUpdated,
  children,
}: ContentPageProps) {
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
            Last updated: {lastUpdated}
          </p>
        )}
        <dl className="mt-16 divide-y divide-gray-900/10 dark:divide-white/10">
          {children}
        </dl>
      </div>
    </div>
  )
}

interface ContentSectionProps {
  title: string
  children: ReactNode
}

export function ContentSection({ title, children }: ContentSectionProps) {
  return (
    <div className="py-8 first:pt-0 last:pb-0 lg:grid lg:grid-cols-12 lg:gap-8">
      <dt className="text-base/7 font-semibold text-gray-900 lg:col-span-5 dark:text-white">
        {title}
      </dt>
      <dd className="mt-4 space-y-4 text-base/7 text-gray-600 lg:col-span-7 lg:mt-0 dark:text-gray-400">
        {children}
      </dd>
    </div>
  )
}

export function ContentList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
