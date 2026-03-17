import styled from 'styled-components'

export const DetailWrapper = styled.div.attrs({
  className: 'sm:px-6 lg:px-8',
})`
  margin: 0 auto;
  padding: 24px;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
`

export const TitleSection = styled.div`
  flex: 1;
`

export const Title = styled.h1<{ $theme?: string }>`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const Metadata = styled.div<{ $theme?: string }>`
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
`

export const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

export const Content = styled.div<{ $theme?: string }>`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ $theme }) => ($theme === 'dark' ? '#e5e7eb' : '#374151')};
  white-space: pre-wrap;
  margin-bottom: 32px;
  overflow: auto;
`

export const ToggleButton = styled.button<{ $theme?: string }>`
  width: 100%;
  padding: 16px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f9fafb')};
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#f3f4f6')};
  }
`

export const RelatedEntitiesContainer = styled.div`
  margin-top: 24px;
`
