'use client'

import { useState, useCallback } from 'react'
import { SectionHeader } from './SectionHeader'
import { EntityList } from './EntityList'
import type { CollapsibleSectionProps } from './types'
import {
  SectionWrapper,
  ContentWrapper,
  SearchWrapper,
  SearchInput,
} from './CollapsibleSection.styles'

export function CollapsibleSection({
  title,
  items,
  icon,
  createHref,
  moreHref,
  isCollapsed,
  theme,
  onExpand,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggle = useCallback(() => {
    if (isCollapsed && onExpand) {
      onExpand()
      setIsExpanded(true)
    } else {
      setIsExpanded((prev) => !prev)
    }
  }, [isCollapsed, onExpand])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [],
  )

  return (
    <SectionWrapper>
      <SectionHeader
        title={title}
        icon={icon}
        count={items.length}
        isExpanded={isExpanded}
        isCollapsed={isCollapsed}
        theme={theme}
        moreHref={moreHref}
        onClick={handleToggle}
      />

      {!isCollapsed && (
        <ContentWrapper $isExpanded={isExpanded}>
          <SearchWrapper>
            <SearchInput
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={handleSearchChange}
              $theme={theme}
              aria-label={`Search ${title}`}
            />
          </SearchWrapper>
          <EntityList
            items={items}
            createHref={createHref}
            moreHref={moreHref}
            searchQuery={searchQuery}
            totalCount={items.length}
            theme={theme}
          />
        </ContentWrapper>
      )}
    </SectionWrapper>
  )
}
