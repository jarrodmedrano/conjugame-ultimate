import styled from 'styled-components'

export const GridWrapper = styled.div`
  padding: 24px;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`

export const Title = styled.h1<{ $theme?: string }>`
  font-size: 32px;
  font-weight: 700;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

export const LocationCard = styled.div<{ $theme?: string }>`
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#ffffff')};
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

export const LocationTitle = styled.h2<{ $theme?: string }>`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const LocationContent = styled.p<{ $theme?: string }>`
  font-size: 14px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  line-height: 1.5;
`

export const PrivacyBadge = styled.span<{
  $isPublic: boolean
  $theme?: string
}>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 12px;
  background: ${({ $isPublic, $theme }) =>
    $isPublic
      ? $theme === 'dark'
        ? '#065f46'
        : '#d1fae5'
      : $theme === 'dark'
      ? '#374151'
      : '#f3f4f6'};
  color: ${({ $isPublic, $theme }) =>
    $isPublic
      ? $theme === 'dark'
        ? '#34d399'
        : '#059669'
      : $theme === 'dark'
      ? '#9ca3af'
      : '#6b7280'};
`
