'use client'

import { useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBarDatepickerHeroSection({
  onSearch,
}: SearchBarProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(value.trim())
  }

  function handleClear() {
    setValue('')
    onSearch('')
  }

  return (
    <section>
      <div className="z-1 max-w-(--breakpoint-xl) relative mx-auto px-4 py-8 text-white lg:py-16 xl:px-0">
        <div className="max-w-(--breakpoint-md) mb-6 lg:mb-0">
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Find your inspiration
          </h1>
          <p className="mb-6 text-gray-300 md:text-lg lg:mb-8 lg:text-xl">
            Peruse through our collection of public Story Bibles. Each guest
            account is allowed one public story. Subscribe to unlock private
            stories and other features.
          </p>
          <a
            href="/signin"
            className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-900 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 focus:outline-hidden inline-flex items-center rounded-lg px-5 py-3 text-center font-medium text-white focus:ring-4"
          >
            Sign In / Register
          </a>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 grid w-full gap-y-4 rounded bg-white p-4 lg:mt-12 lg:grid-cols-9 lg:gap-x-4 dark:bg-gray-800"
        >
          <div className="relative lg:col-span-4">
            <Label htmlFor="story-search" className="sr-only">
              Search stories
            </Label>
            <Input
              id="story-search"
              placeholder="Search stories by title or content"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <Button type="submit" className="lg:col-span-2">
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            Search
          </Button>
        </form>
      </div>
    </section>
  )
}
