import {
  SparklesIcon,
  BookOpenIcon,
  UsersIcon,
} from '@heroicons/react/20/solid'

const features = [
  {
    name: 'AI story assistant',
    description:
      'Describe your scene or character and let the AI help you develop it further. Catch plot holes, suggest backstory details, and keep your narrative consistent across hundreds of entries without leaving your story bible.',
    href: '/about/features',
    icon: SparklesIcon,
  },
  {
    name: 'Wiki-style story bibles',
    description:
      'Every character, location, and timeline entry is a living document. Add images, rich text, and cross-links so your world feels as interconnected as it really is. Search across everything instantly.',
    href: '/about/features',
    icon: BookOpenIcon,
  },
  {
    name: 'Characters, locations & timelines',
    description:
      'Purpose-built entry types for the building blocks of every story. Track character arcs, map out locations with history and atmosphere, and sequence events on a visual timeline. Structured, but flexible.',
    href: '/about/features',
    icon: UsersIcon,
  },
]

export const Feature = () => {
  return (
    <div className="bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-primary-400 text-base font-semibold leading-7">
            Built for storytellers
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything a writer needs to stay in the flow
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Whether you write novels, screenplays, games, or fan fiction, Story
            Bible Ultimate adapts to your process. Start simple and grow your
            world as your story does.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <feature.icon
                    className="text-primary-400 h-5 w-5 flex-none"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <a
                      href={feature.href}
                      className="text-primary-400 text-sm font-semibold leading-6"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
