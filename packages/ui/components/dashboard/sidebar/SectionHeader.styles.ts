import styled from 'styled-components'

export const HeaderWrapper = styled.button<{
  $isExpanded: boolean
  $theme?: string
}>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: ${({ $isExpanded, $theme }) =>
    $isExpanded
      ? $theme === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.1)'
      : 'none'};

  &:hover {
    background-color: ${({ $theme }) =>
      $theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  }

  &:focus-visible {
    outline: 2px solid
      ${({ $theme }) => ($theme === 'dark' ? '#60a5fa' : '#2563eb')};
    outline-offset: 2px;
  }
`

export const IconWrapper = styled.div<{ $isCollapsed?: boolean }>`
  display: flex;
  align-items: center;
  ${({ $isCollapsed }) => !$isCollapsed && 'margin-right: 0.5rem;'}

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

export const Title = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
`

export const TitleLink = styled.a<{ $theme?: string }>`
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: underline;
    color: ${({ $theme }) => ($theme === 'dark' ? '#93c5fd' : '#2563eb')};
  }
`

export const CountBadge = styled.span<{ $theme?: string }>`
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: ${({ $theme }) =>
    $theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  font-size: 0.75rem;
  font-weight: 500;
`

export const ChevronWrapper = styled.div<{ $isExpanded: boolean }>`
  margin-left: auto;
  display: flex;
  align-items: center;
  transform: ${({ $isExpanded }) =>
    $isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }
`
