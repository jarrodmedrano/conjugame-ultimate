import React from 'react'
import MasonryGrid, { EntityGridItem } from './masonry'

const imageUrls = [
  'https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image.jpg',
  'https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-1.jpg',
]

const items: EntityGridItem[] = imageUrls.map((url, index) => ({
  id: index,
  title: `Image ${index + 1}`,
  content: null,
  slug: null,
  userId: '',
  primaryImageUrl: url,
  href: url,
}))

const GalleryPage = () => {
  return <MasonryGrid items={items} />
}

export default GalleryPage
