import styled from 'styled-components'

/**
 * Styled components for AddExistingModal
 *
 * THEME-AWARE STYLING:
 * Theme-aware colors and styling are handled by the Dialog components from
 * @repo/ui/components/ui/dialog, which use Tailwind CSS classes with CSS
 * variables (e.g., bg-background, text-muted-foreground).
 *
 * These CSS variables automatically adapt to the current theme (light/dark)
 * via the ThemeProvider and next-themes integration.
 *
 * No transient $theme props are needed in these styled components as the
 * theme handling is managed at the CSS variable level by Tailwind.
 */

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 70vh;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.2);
  }

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }
`

export const EntityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  max-height: 400px;
  padding: 0.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
`

export const EntityItem = styled.label<{ $isDisabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
  background: ${({ $isDisabled }) =>
    $isDisabled ? 'hsl(var(--muted) / 0.5)' : 'transparent'};
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.6 : 1)};
  transition: background-color 0.2s;

  &:hover {
    background: ${({ $isDisabled }) =>
      $isDisabled ? 'hsl(var(--muted) / 0.5)' : 'hsl(var(--accent) / 0.5)'};
  }
`

export const EntityCheckbox = styled.div`
  display: flex;
  align-items: center;
  padding-top: 0.125rem;
`

export const EntityInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

export const EntityName = styled.div`
  font-weight: 500;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  line-height: 1.25rem;
`

export const EntityDescription = styled.div`
  font-size: 0.75rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
`

export const LinkedBadge = styled.span`
  font-size: 0.75rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  background: hsl(var(--muted));
  border-radius: 0.25rem;
  align-self: flex-start;
`

export const NoResults = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  line-height: 1.25rem;
`

export const ModalActions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`

export const RelationshipSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--muted) / 0.3);
`

export const RelationshipLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
`

export const RelationshipSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.2);
  }
`

export const CustomLabelInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.2);
  }

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }
`
