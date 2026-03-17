import styled from 'styled-components'

export const FormWrapper = styled.form<{ $theme?: string }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 800px;
  padding: 24px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1a1a1a' : '#ffffff')};
  border-radius: 12px;
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#333333' : '#e5e7eb')};
`

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const Label = styled.label<{ $theme?: string; $required?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f3f4f6' : '#111827')};

  ${({ $required }) =>
    $required &&
    `
    &::after {
      content: ' *';
      color: #ef4444;
    }
  `}
`

export const Input = styled.input<{ $theme?: string }>`
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#d1d5db')};
  border-radius: 8px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#111827' : '#ffffff')};
  color: ${({ $theme }) => ($theme === 'dark' ? '#f3f4f6' : '#111827')};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ $theme }) =>
      $theme === 'dark' ? '#60a5fa' : '#3b82f6'};
    box-shadow: 0 0 0 3px
      ${({ $theme }) =>
        $theme === 'dark'
          ? 'rgba(96, 165, 250, 0.1)'
          : 'rgba(59, 130, 246, 0.1)'};
  }

  &::placeholder {
    color: ${({ $theme }) => ($theme === 'dark' ? '#6b7280' : '#9ca3af')};
  }
`

export const Textarea = styled.textarea<{ $theme?: string }>`
  padding: 12px 16px;
  font-size: 16px;
  font-family: inherit;
  border: 2px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#d1d5db')};
  border-radius: 8px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#111827' : '#ffffff')};
  color: ${({ $theme }) => ($theme === 'dark' ? '#f3f4f6' : '#111827')};
  min-height: 200px; /* Sufficient height for story content editing */
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ $theme }) =>
      $theme === 'dark' ? '#60a5fa' : '#3b82f6'};
    box-shadow: 0 0 0 3px
      ${({ $theme }) =>
        $theme === 'dark'
          ? 'rgba(96, 165, 250, 0.1)'
          : 'rgba(59, 130, 246, 0.1)'};
  }

  &::placeholder {
    color: ${({ $theme }) => ($theme === 'dark' ? '#6b7280' : '#9ca3af')};
  }
`

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`

export const Button = styled.button<{
  $variant?: 'primary' | 'secondary'
  $theme?: string
}>`
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ $variant, $theme }) =>
    $variant === 'primary'
      ? `
    background: ${$theme === 'dark' ? '#3b82f6' : '#2563eb'};
    color: #ffffff;

    &:hover {
      background: ${$theme === 'dark' ? '#2563eb' : '#1d4ed8'};
    }

    &:active {
      background: ${$theme === 'dark' ? '#1d4ed8' : '#1e40af'};
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px ${
        $theme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.4)'
      };
    }
  `
      : `
    background: transparent;
    color: ${$theme === 'dark' ? '#f3f4f6' : '#111827'};
    border: 2px solid ${$theme === 'dark' ? '#374151' : '#d1d5db'};

    &:hover {
      background: ${$theme === 'dark' ? '#1f2937' : '#f3f4f6'};
    }

    &:active {
      background: ${$theme === 'dark' ? '#111827' : '#e5e7eb'};
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px ${
        $theme === 'dark' ? 'rgba(55, 65, 81, 0.4)' : 'rgba(209, 213, 219, 0.4)'
      };
    }
  `}
`
