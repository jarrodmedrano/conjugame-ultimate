'use client'

import {
  ImageLightbox,
  useEntityLightbox,
  GallerySection,
} from '@repo/ui/components/lightbox'
import { DetailHeader, DetailFooter } from '../../shared/components'
import type { EntityImage } from '../../../types/entity-image'
import { DetailWrapper, Content } from '@repo/ui/components/detail'
import { StoryInfobox } from './StoryInfobox'
import type { StoryAttribute } from '@repo/database'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date | null
  updated_at: Date | null
}

interface StoryDetailProps {
  story: Story
  userId: string
  isOwner: boolean
  images?: EntityImage[]
  attributes?: StoryAttribute[]
  relationshipMapHref?: string
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  onToggleRelated?: () => void
  showRelated?: boolean
  theme?: string
}

export function StoryDetail({
  story,
  userId,
  isOwner,
  images,
  attributes = [],
  relationshipMapHref,
  onEdit,
  onDelete,
  onTogglePrivacy,
  onToggleRelated,
  showRelated,
  theme,
}: StoryDetailProps) {
  const primaryImage = images?.find((img) => img.isPrimary)
  const galleryImages = images?.filter((img) => !img.isPrimary) || []

  const {
    lightboxState,
    handleImageClick,
    handleLightboxClose,
    lightboxImages,
    allImages,
  } = useEntityLightbox({
    images,
    entityName: story.title,
  })

  return (
    <DetailWrapper data-testid="story-detail">
      <div className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1">
          <DetailHeader
            title={story.title}
            entityType="story"
            userId={userId}
            privacy={story.privacy}
            createdAt={story.created_at}
            updatedAt={story.updated_at}
            primaryImageUrl={primaryImage?.cloudinaryUrl}
            primaryImageAlt={story.title}
            isOwner={isOwner}
            theme={theme}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePrivacy={onTogglePrivacy}
          />
          <Content $theme={theme} data-testid="story-content">
            <StoryInfobox
              storyTitle={story.title}
              primaryImageUrl={primaryImage?.cloudinaryUrl}
              attributes={attributes}
              theme={theme}
            />
            {story.content}
          </Content>

          <DetailFooter
            onToggleRelated={onToggleRelated}
            showRelated={showRelated}
            relationshipMapHref={relationshipMapHref}
          />
        </div>

        {/* Sidebar gallery */}
        <GallerySection
          images={galleryImages}
          onImageClick={(imageId) => {
            const imageIndex = allImages.findIndex((i) => i.id === imageId)
            if (imageIndex !== -1) {
              handleImageClick(imageIndex)
            }
          }}
        />
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxState.isOpen}
        initialIndex={lightboxState.currentIndex}
        onClose={handleLightboxClose}
      />
    </DetailWrapper>
  )
}
