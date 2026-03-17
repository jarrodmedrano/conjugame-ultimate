import styled from 'styled-components'

export const ListWrapper = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 24rem;
  overflow-y: auto;
`

export const ListItem = styled.a<{ $theme?: string }>`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const AddNewItem = styled(ListItem)`
  font-weight: 500;

  svg {
    margin-right: 0.5rem;
    width: 1rem;
    height: 1rem;
  }
`

export const ViewAllLink = styled(ListItem)`
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  font-size: 0.875rem;

  svg {
    margin-left: auto;
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    text-decoration: underline;
  }
`

export const EmptyState = styled.div<{ $theme?: string }>`
  padding: 1rem 0.75rem;
  text-align: center;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  font-size: 0.875rem;
`
