import { CheckIcon } from '@heroicons/react/20/solid'
import { Button } from '../ui/button'
import Link from 'next/link'

const features = [
  {
    name: 'Character profiles',
    description:
      'Build detailed character sheets with backstory, personality traits, relationships, and image galleries.',
  },
  {
    name: 'Location builder',
    description:
      'Map out your world with rich location entries covering history, atmosphere, and notable details.',
  },
  {
    name: 'Timeline tracking',
    description:
      'Lay out events, plot points, and story arcs in chronological order so nothing slips through the cracks.',
  },
  {
    name: 'Wiki-style cross-linking',
    description:
      'Link characters, locations, and events together just like a professional story wiki.',
  },
  {
    name: 'AI story assistant',
    description:
      'Get AI-powered suggestions to spot plot holes, maintain character consistency, and deepen your world-building.',
  },
  {
    name: 'Image galleries',
    description:
      'Attach reference art, mood boards, and photos to any character, location, or timeline entry.',
  },
  {
    name: 'Relationship mapping',
    description:
      'Visualize how your characters connect — allies, rivals, family, and everything in between.',
  },
  {
    name: 'Public sharing',
    description:
      'Share your story bible with collaborators or readers, or keep it completely private.',
  },
]

export const FeatureList = () => {
  return (
    <div className="bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          <div>
            <h2 className="text-primary-600 dark:text-primary-400 text-base font-semibold leading-7">
              Everything you need
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              One place for your entire story world
            </p>
            <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400">
              Stop juggling scattered notes, spreadsheets, and docs. Story Bible
              Ultimate gives every element of your story a home: organized,
              searchable, and always at your fingertips.
            </p>
            <div className="mt-6">
              <Link href="/about/features">
                <Button className="bg-primary">See all features</Button>
              </Link>
            </div>
          </div>
          <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16 dark:text-gray-400">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-9">
                <dt className="font-semibold text-gray-900 dark:text-white">
                  <CheckIcon
                    className="text-primary-500 absolute left-0 top-1 h-5 w-5"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-2">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
