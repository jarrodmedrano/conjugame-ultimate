import styled from 'styled-components'

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
`

export const Avatar = styled.div<{ $theme?: string }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ $theme }) => ($theme === 'dark' ? '#3b82f6' : '#2563eb')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const AvatarInitial = styled.span<{ $theme?: string }>`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
`

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

export const UserName = styled.h1<{ $theme?: string }>`
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#ffffff' : '#111827')};
`

export const UserEmail = styled.p<{ $theme?: string }>`
  font-size: 14px;
  margin: 0;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
`

export const LoadingSkeleton = styled.div<{ $theme?: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
`

export const SkeletonAvatar = styled.div<{ $theme?: string }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f3f4f6')};
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;

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

export const SkeletonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`

export const SkeletonName = styled.div<{ $theme?: string }>`
  height: 24px;
  width: 200px;
  border-radius: 4px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f3f4f6')};
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

export const SkeletonEmail = styled.div<{ $theme?: string }>`
  height: 16px;
  width: 160px;
  border-radius: 4px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f3f4f6')};
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

export const UsernameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
`

export const UsernameText = styled.span<{ $theme?: string }>`
  font-size: 13px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#6b7280' : '#9ca3af')};
`

export const EditUsernameButton = styled.button<{ $theme?: string }>`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#d1d5db')};
  background: transparent;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  line-height: 1.5;

  &:hover {
    background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f3f4f6')};
  }
`

export const UsernameForm = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`

export const UsernameInput = styled.input<{ $theme?: string }>`
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#4b5563' : '#d1d5db')};
  background: ${({ $theme }) => ($theme === 'dark' ? '#111827' : '#ffffff')};
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
  outline: none;
  width: 160px;

  &:focus {
    border-color: #3b82f6;
  }
`

export const SaveButton = styled.button<{ $theme?: string }>`
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 4px;
  border: none;
  background: #3b82f6;
  color: #ffffff;
  cursor: pointer;
  line-height: 1.5;

  &:hover {
    background: #2563eb;
  }
`

export const CancelButton = styled.button<{ $theme?: string }>`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid
    ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#d1d5db')};
  background: transparent;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  line-height: 1.5;

  &:hover {
    background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f3f4f6')};
  }
`

export const UsernameError = styled.span`
  font-size: 12px;
  color: #ef4444;
`
