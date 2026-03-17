'use client'

import Image from 'next/image'
import Link from 'next/link'

export interface EntityGridItem {
  id: number
  title: string
  content: string | null
  slug: string | null
  userId: string
  primaryImageUrl: string | null
  href: string
}

const GRADIENT_PALETTE = [
  'from-violet-600 to-indigo-600',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
]

function getGradient(id: number): string {
  return GRADIENT_PALETTE[id % GRADIENT_PALETTE.length]
}

export default function MasonryGrid({ items }: { items: EntityGridItem[] }) {
  return (
    <div className="parallax grid grid-cols-4 gap-4 md:grid-cols-8">
      {items.map((item) => {
        const gradient = getGradient(item.id)
        return (
          <Link href={item.href} key={item.id}>
            <div className="parallax-container relative h-64 overflow-hidden rounded-lg">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
              />
              {item.primaryImageUrl && (
                <Image
                  className="parallax-img absolute inset-0 h-full w-full origin-bottom rounded-lg object-cover"
                  src={item.primaryImageUrl}
                  alt={item.title}
                  width={400}
                  height={600}
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                <p className="truncate text-sm font-medium text-white">
                  {item.title}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
