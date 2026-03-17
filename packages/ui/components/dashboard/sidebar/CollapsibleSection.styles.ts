import styled from 'styled-components'

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

export const ContentWrapper = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => ($isExpanded ? '32rem' : '0')};
  overflow: hidden;
  transition: max-height 0.2s ease-in-out;
`

export const SearchWrapper = styled.div`
  padding: 0.5rem 0.75rem;
`

export const SearchInput = styled.input<{ $theme?: string }>`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid
    ${({ $theme }) =>
      $theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  background-color: ${({ $theme }) =>
    $theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.9)'};
  color: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  }

  &:focus {
    border-color: ${({ $theme }) =>
      $theme === 'dark' ? '#60a5fa' : '#2563eb'};
  }
`
