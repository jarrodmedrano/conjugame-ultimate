import styled from 'styled-components'

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const SectionTitle = styled.h2<{ $theme?: string }>`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#ffffff' : '#111827')};
`

export const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`

export const ItemCard = styled.div<{ $theme?: string }>`
  padding: 16px;
  border-radius: 8px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#ffffff')};
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ $theme }) =>
      $theme === 'dark' ? '#60a5fa' : '#3b82f6'};
  }
`

export const ItemTitle = styled.h3<{ $theme?: string }>`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#ffffff' : '#111827')};
`

export const ItemDescription = styled.p<{ $theme?: string }>`
  font-size: 14px;
  margin: 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  line-height: 1.5;
`

export const SkeletonCard = styled.div<{ $theme?: string }>`
  padding: 16px;
  border-radius: 8px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f3f4f6')};
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
  height: 120px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
`

export const EmptyStateTitle = styled.h3<{ $theme?: string }>`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#ffffff' : '#111827')};
`

export const EmptyStateDescription = styled.p<{ $theme?: string }>`
  font-size: 14px;
  margin: 0 0 24px 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
`

export const StyledLink = styled.a`
  text-decoration: none;
  display: block;
`

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

export const ViewAllLink = styled.a<{ $theme?: string }>`
  font-size: 14px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#60a5fa' : '#3b82f6')};
  text-decoration: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`
