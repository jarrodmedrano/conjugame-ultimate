'use client'

import { Globe, Lock } from 'lucide-react'
import {
  Header,
  TitleSection,
  Title,
  Metadata,
  ActionButtons,
} from '@repo/ui/components/detail'
import { Breadcrumb } from '@repo/ui/components/ui/breadcrumb'
import { EntityActions } from './EntityActions'
import type { DetailHeaderProps } from './DetailHeader.types'

const entityListSegments: Record<
  DetailHeaderProps['entityType'],
  { label: string; path: string }
> = {
  character: { label: 'Characters', path: 'characters' },
  story: { label: 'Stories', path: 'stories' },
  location: { label: 'Locations', path: 'locations' },
  timeline: { label: 'Timelines', path: 'timelines' },
}

export function DetailHeader({
  title,
  entityType,
  userId,
  privacy,
  createdAt,
  updatedAt,
  primaryImageUrl,
  primaryImageAlt,
  isOwner,
  theme,
  onEdit,
  onDelete,
  onTogglePrivacy,
}: DetailHeaderProps) {
  const { label, path } = entityListSegments[entityType]

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'My Profile', href: `/${userId}` },
          { label, href: `/${userId}/${path}` },
          { label: title },
        ]}
        className="mb-4"
      />
      <Header>
        <TitleSection>
          <Title $theme={theme} data-testid={`${entityType}-title`}>
            {title}
          </Title>
          <Metadata $theme={theme} data-testid={`${entityType}-metadata`}>
            {createdAt && (
              <>
                <span data-testid={`${entityType}-created-date`}>
                  Created: {new Date(createdAt).toLocaleDateString()}
                </span>
                <span>&bull;</span>
              </>
            )}
            {updatedAt && (
              <>
                <span data-testid={`${entityType}-updated-date`}>
                  Updated: {new Date(updatedAt).toLocaleDateString()}
                </span>
                <span>&bull;</span>
              </>
            )}
            <span
              data-testid={`${entityType}-privacy-badge`}
              className="inline-flex items-center gap-1"
            >
              {privacy === 'public' ? (
                <>
                  <Globe className="h-4 w-4" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Private
                </>
              )}
            </span>
          </Metadata>
        </TitleSection>
        {isOwner && (
          <ActionButtons>
            <EntityActions
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePrivacy={onTogglePrivacy}
              privacy={privacy}
              entityName={title}
              entityType={entityType}
            />
          </ActionButtons>
        )}
      </Header>
    </>
  )
}
