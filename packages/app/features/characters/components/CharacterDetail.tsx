'use client'

import {
  ImageLightbox,
  useEntityLightbox,
  GallerySection,
} from '@repo/ui/components/lightbox'
import { DetailHeader, DetailFooter } from '../../shared/components'
import type { EntityImage } from '../../../types/entity-image'
import { DetailWrapper, Content } from '@repo/ui/components/detail'
import { CharacterInfobox } from './CharacterInfobox'
import type { CharacterAttribute } from '@repo/database'

interface Character {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
  updatedAt: Date | null
  slug?: string | null
}

interface CharacterDetailProps {
  character: Character
  userId: string
  isOwner: boolean
  images?: EntityImage[]
  attributes?: CharacterAttribute[]
  relationshipMapHref?: string
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  onToggleRelated?: () => void
  showRelated?: boolean
  theme?: string
}

export function CharacterDetail({
  character,
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
}: CharacterDetailProps) {
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
    entityName: character.name,
  })

  return (
    <DetailWrapper data-testid="character-detail">
      <div className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1">
          <DetailHeader
            title={character.name}
            entityType="character"
            userId={userId}
            privacy={character.privacy}
            createdAt={character.createdAt}
            updatedAt={character.updatedAt}
            primaryImageUrl={primaryImage?.cloudinaryUrl}
            primaryImageAlt={character.name}
            isOwner={isOwner}
            theme={theme}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePrivacy={onTogglePrivacy}
          />

          <Content $theme={theme} data-testid="character-content">
            <CharacterInfobox
              characterName={character.name}
              primaryImageUrl={primaryImage?.cloudinaryUrl}
              attributes={attributes}
              theme={theme}
            />
            {character.description || 'No description provided'}
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
