import styled from 'styled-components'
import { GuardedLink } from './GuardedLink'

export const GridWrapper = styled.div`
  width: 100%;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
`

export const EntityLink = styled(GuardedLink)`
  text-decoration: none;
`

export const PanelContent = styled.div`
  height: 100%;
  padding: 16px;
  overflow-y: auto;
`

export const PanelHeader = styled.div<{ $theme?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid;
  border-color: ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
`

export const PanelTitle = styled.h3<{ $theme?: string }>`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const PanelActions = styled.div`
  display: flex;
  gap: 8px;
`

export const EntitiesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const EntityCard = styled.div<{ $theme?: string }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#ffffff')};
  border: 1px solid;
  border-color: ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ $theme }) =>
      $theme === 'dark' ? '#60a5fa' : '#3b82f6'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`

export const EntityCardContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding-right: 24px;
  min-width: 0;
`

export const EntityName = styled.div<{ $theme?: string }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const EntityDescription = styled.div<{ $theme?: string }>`
  font-size: 12px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  line-height: 1.4;
`

export const RemoveButton = styled.button<{ $theme?: string }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#f3f4f6')};
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $theme }) => ($theme === 'dark' ? '#ef4444' : '#fee2e2')};
    color: ${({ $theme }) => ($theme === 'dark' ? '#ffffff' : '#dc2626')};
  }
`

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
`

export const EmptyStateText = styled.p<{ $theme?: string }>`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
`

export const EmptyStateActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`

export const RelationshipBadge = styled.span<{ $isFamily?: boolean }>`
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  background: ${({ $isFamily }) =>
    $isFamily ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))'};
  color: ${({ $isFamily }) =>
    $isFamily ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'};
  white-space: nowrap;
`
