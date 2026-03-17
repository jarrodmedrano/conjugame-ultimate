'use client'

import Link from 'next/link'
import {
  ChevronDown,
  BookOpen,
  Users,
  MapPin,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/ui/tooltip'
import type { SectionHeaderProps } from './types'
import {
  HeaderWrapper,
  IconWrapper,
  TitleLink,
  CountBadge,
  ChevronWrapper,
} from './SectionHeader.styles'

// Icon map for string icon names
const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Users,
  MapPin,
  Clock,
}

export function SectionHeader({
  title,
  icon: iconProp,
  count,
  isExpanded,
  isCollapsed,
  theme,
  moreHref,
  onClick,
}: SectionHeaderProps) {
  // Resolve icon to component
  const Icon =
    typeof iconProp === 'string' ? iconMap[iconProp] || BookOpen : iconProp
  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <HeaderWrapper
            onClick={onClick}
            $isExpanded={isExpanded}
            $theme={theme}
            aria-label={`${title} (${count})`}
            aria-expanded={isExpanded}
          >
            <IconWrapper $isCollapsed={true}>
              <Icon />
            </IconWrapper>
          </HeaderWrapper>
        </TooltipTrigger>
        <TooltipContent side="right">
          {title} ({count})
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <HeaderWrapper
      onClick={onClick}
      $isExpanded={isExpanded}
      $theme={theme}
      aria-label={`${title} section`}
      aria-expanded={isExpanded}
    >
      <IconWrapper $isCollapsed={false}>
        <Icon />
      </IconWrapper>
      <Link href={moreHref} onClick={(e) => e.stopPropagation()}>
        <TitleLink as="span" $theme={theme}>
          {title}
        </TitleLink>
      </Link>
      <CountBadge $theme={theme}>{count}</CountBadge>
      <ChevronWrapper $isExpanded={isExpanded}>
        <ChevronDown />
      </ChevronWrapper>
    </HeaderWrapper>
  )
}
