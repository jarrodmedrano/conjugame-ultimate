import Link from 'next/link'
import { Button } from '@repo/ui/components/ui/button'
import { UpgradePrompt } from '@repo/ui/components/upgrade-prompt'
import {
  SectionWrapper,
  SectionHeader,
  SectionTitle,
  ItemsGrid,
  ItemCard,
  ItemTitle,
  ItemDescription,
  SkeletonCard,
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription,
  StyledLink,
  HeaderLeft,
  ViewAllLink,
} from './ContentSection.styles'

interface ContentItem {
  id: string | number
  name?: string
  title?: string
  description?: string | null
  content?: string
  userid?: string
  createdAt?: Date | null
}

interface QuotaInfo {
  subscribed: boolean
  count: number
  limit: number
}

interface ContentSectionProps {
  title: string
  entityType: 'story' | 'character' | 'timeline' | 'location'
  items: ContentItem[]
  isLoading: boolean
  onAddNew: () => void
  theme?: string
  userId: string
  quota?: QuotaInfo
}

export function ContentSection({
  title,
  entityType,
  items,
  isLoading,
  onAddNew,
  theme,
  userId,
  quota,
}: ContentSectionProps) {
  const atLimit = quota && !quota.subscribed && quota.count >= quota.limit
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1)

  const renderLoadingState = () => (
    <ItemsGrid>
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} $theme={theme} data-testid="skeleton-card" />
      ))}
    </ItemsGrid>
  )

  const renderEmptyState = () => (
    <EmptyState>
      <EmptyStateTitle $theme={theme}>
        No {title?.toLowerCase()} yet
      </EmptyStateTitle>
      <EmptyStateDescription $theme={theme}>
        Create your first {entityType} to get started
      </EmptyStateDescription>
      <Button onClick={onAddNew}>New {entityLabel}</Button>
    </EmptyState>
  )

  // Handle irregular plurals
  const getEntityPath = (type: string) => {
    if (type === 'timeline') return 'timelines'
    if (type === 'story') return 'stories'
    return `${type}s`
  }

  const renderItems = () => (
    <ItemsGrid>
      {items.map((item) => {
        const displayName = item.name || item.title || 'Untitled'
        const entityPath = getEntityPath(entityType)
        const href = `/${userId}/${entityPath}/${item.id}`

        const rawDescription = item.description || item.content
        const description = rawDescription
          ? rawDescription.length > 80
            ? `${rawDescription.slice(0, 80)}…`
            : rawDescription
          : null

        return (
          <Link key={item.id} href={href} passHref legacyBehavior>
            <StyledLink>
              <ItemCard $theme={theme}>
                <ItemTitle $theme={theme}>{displayName}</ItemTitle>
                {description && (
                  <ItemDescription $theme={theme}>
                    {description}
                  </ItemDescription>
                )}
              </ItemCard>
            </StyledLink>
          </Link>
        )
      })}
    </ItemsGrid>
  )

  const entityPath = getEntityPath(entityType)

  const getEntityPlural = (type: string) => {
    if (type === 'timeline') return 'timelines'
    if (type === 'story') return 'stories'
    return `${type}s`
  }

  return (
    <SectionWrapper>
      <SectionHeader>
        <HeaderLeft>
          <SectionTitle $theme={theme}>{title}</SectionTitle>
          <Link href={`/${userId}/${entityPath}`} passHref legacyBehavior>
            <ViewAllLink $theme={theme}>View All →</ViewAllLink>
          </Link>
          {quota && !quota.subscribed && (
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              {quota.count}/{quota.limit} used
            </span>
          )}
        </HeaderLeft>
        <Button onClick={onAddNew} size="sm" disabled={!!atLimit}>
          New {entityLabel}
        </Button>
      </SectionHeader>

      {atLimit && quota && (
        <UpgradePrompt
          entityType={getEntityPlural(entityType)}
          count={quota.count}
          limit={quota.limit}
        />
      )}

      {isLoading && renderLoadingState()}
      {!isLoading && items.length === 0 && renderEmptyState()}
      {!isLoading && items.length > 0 && renderItems()}
    </SectionWrapper>
  )
}
