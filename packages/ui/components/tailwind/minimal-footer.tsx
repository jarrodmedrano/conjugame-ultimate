'use client'
import { useEffect, useState } from 'react'

const links = [
  { name: 'Pricing', href: '/about/pricing' },
  { name: 'Contact', href: '/about/contact' },
  { name: 'Privacy', href: '/about/privacy' },
]

export const MinimalFooter = () => {
  const [year, setYear] = useState('')

  useEffect(() => {
    setYear(String(new Date().getFullYear()))
  }, [])

  return (
    <footer className="border-t border-white/10 bg-gray-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-8">
        <p className="text-xs text-gray-400">
          © {year} Conjugame. All rights reserved.
        </p>
        <nav className="flex gap-6">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs text-gray-400 hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
