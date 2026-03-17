import { createPagesSubNav } from '@repo/ui/components/dashboard/utils/build-nav'
import { createKeyIndex } from '@repo/ui/components/dashboard/utils/build-nav'
import { cn } from '@repo/ui/lib/utils'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Sitemap } from '../../types/sitemap'

export const usePageNav = (
  sitemap: Sitemap,
  pathname: string,
  t: (key: string) => string,
  userId?: string,
) => {
  const [pages, setPages] = useState([])

  useEffect(() => {
    const keyIndex = createKeyIndex(sitemap)
    const reducedPages = createPagesSubNav(keyIndex, 'pages', {})
    setPages(reducedPages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    pages: pages?.map(
      (page: { title: string; href: string; children?: ReactElement[] }) => {
        return page?.children ? (
          <DropdownMenu key={page?.title}>
            <DropdownMenuTrigger asChild>
              <Link
                key={page?.title}
                href={page?.href}
                className={cn(
                  'hover:text-foreground/80 transition-colors',
                  pathname === page?.href
                    ? 'text-foreground'
                    : 'text-foreground/60',
                )}
              >
                {t(page?.title)}
              </Link>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {page?.children?.map((link: any) => (
                <DropdownMenuGroup key={link?.title}>
                  <a href={`${link?.href?.replace(':user', userId || '')}`}>
                    <DropdownMenuItem>{t(link?.title)}</DropdownMenuItem>
                  </a>
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            key={page?.title}
            href={page?.href}
            className={cn(
              'hover:text-foreground/80 transition-colors',
              pathname === page?.href
                ? 'text-foreground'
                : 'text-foreground/60',
            )}
          >
            {t(page?.title)}
          </Link>
        )
      },
    ),
  }
}
