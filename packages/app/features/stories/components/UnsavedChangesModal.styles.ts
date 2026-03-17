import styled from 'styled-components'

/**
 * Styled components for UnsavedChangesModal
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

export const ModalActions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`
