'use client'

import {
  ImageLightbox,
  useEntityLightbox,
  GallerySection,
} from '@repo/ui/components/lightbox'
import { DetailHeader, DetailFooter } from '../../shared/components'
import type { EntityImage } from '../../../types/entity-image'
import { DetailWrapper, Content } from '@repo/ui/components/detail'
import { LocationInfobox } from './LocationInfobox'
import type { LocationAttribute } from '@repo/database'

interface Location {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
  updatedAt: Date | null
}

interface LocationDetailProps {
  location: Location
  userId: string
  isOwner: boolean
  images?: EntityImage[]
  attributes?: LocationAttribute[]
  relationshipMapHref?: string
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  onToggleRelated?: () => void
  showRelated?: boolean
  theme?: string
}

export function LocationDetail({
  location,
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
}: LocationDetailProps) {
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
    entityName: location.name,
  })

  return (
    <DetailWrapper data-testid="location-detail">
      <div className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1">
          <DetailHeader
            title={location.name}
            entityType="location"
            userId={userId}
            privacy={location.privacy}
            createdAt={location.createdAt}
            updatedAt={location.updatedAt}
            primaryImageUrl={primaryImage?.cloudinaryUrl}
            primaryImageAlt={location.name}
            isOwner={isOwner}
            theme={theme}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePrivacy={onTogglePrivacy}
          />
          <Content $theme={theme} data-testid="location-content">
            <LocationInfobox
              locationName={location.name}
              primaryImageUrl={primaryImage?.cloudinaryUrl}
              attributes={attributes}
              theme={theme}
            />
            {location.description || 'No description provided'}
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
