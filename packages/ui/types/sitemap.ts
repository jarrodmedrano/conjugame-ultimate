export type Page = {
  name?: string
  loc: string
  children?: SitemapPageItem[]
}

export type Collection = {
  name: string
  loc: string
  items: SitemapPageItem[]
}

export type SitemapPageItem = {
  page: Page
}

export type SitemapCollectionItem = {
  collection: Collection
}

export type SitemapItem = SitemapPageItem | SitemapCollectionItem

export type Sitemap = SitemapItem[]
