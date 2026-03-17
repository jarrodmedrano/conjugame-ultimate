'use client'

import React, { useState } from 'react'
import {
  HeaderWrapper,
  Avatar,
  AvatarInitial,
  UserInfo,
  UserName,
  UserEmail,
  LoadingSkeleton,
  SkeletonAvatar,
  SkeletonInfo,
  SkeletonName,
  SkeletonEmail,
  UsernameRow,
  UsernameText,
  EditUsernameButton,
  UsernameForm,
  UsernameInput,
  SaveButton,
  CancelButton,
  UsernameError,
} from './UserInfoHeader.styles'

interface User {
  id: string
  name: string
  email: string
}

interface UserInfoHeaderProps {
  user: User | null
  theme?: string
  username?: string
  isOwner?: boolean
  onUpdateUsername?: (
    username: string,
  ) => Promise<{ success?: boolean; error?: string; username?: string }>
}

export function UserInfoHeader({
  user,
  theme,
  username,
  isOwner,
  onUpdateUsername,
}: UserInfoHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState(username ?? '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleEditClick = () => {
    setEditUsername(username ?? '')
    setUsernameError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setUsernameError(null)
  }

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onUpdateUsername) return

    setIsSaving(true)
    setUsernameError(null)
    try {
      const result = await onUpdateUsername(editUsername)
      if (result.error) {
        setUsernameError(result.error)
      } else {
        setIsEditing(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUsername(e.target.value)
  }

  const renderLoadingState = () => (
    <LoadingSkeleton>
      <SkeletonAvatar $theme={theme} data-testid="skeleton-avatar" />
      <SkeletonInfo>
        <SkeletonName $theme={theme} data-testid="skeleton-name" />
        <SkeletonEmail $theme={theme} data-testid="skeleton-email" />
      </SkeletonInfo>
    </LoadingSkeleton>
  )

  const renderUserInfo = () => {
    if (!user) {
      return null
    }

    const firstInitial = user.name.charAt(0).toUpperCase()

    return (
      <HeaderWrapper>
        <Avatar $theme={theme}>
          <AvatarInitial $theme={theme}>{firstInitial}</AvatarInitial>
        </Avatar>
        <UserInfo>
          <UserName $theme={theme}>{user.name}</UserName>
          <UserEmail $theme={theme}>{user.email}</UserEmail>
          {username && (
            <UsernameRow>
              {!isEditing && (
                <UsernameText $theme={theme}>@{username}</UsernameText>
              )}
              {isOwner && onUpdateUsername && !isEditing && (
                <EditUsernameButton $theme={theme} onClick={handleEditClick}>
                  Edit
                </EditUsernameButton>
              )}
              {isEditing && (
                <UsernameForm onSubmit={handleSaveUsername}>
                  <UsernameInput
                    $theme={theme}
                    value={editUsername}
                    onChange={handleUsernameChange}
                    disabled={isSaving}
                    autoFocus
                    placeholder="username"
                  />
                  <SaveButton $theme={theme} type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                  </SaveButton>
                  <CancelButton
                    $theme={theme}
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </CancelButton>
                  {usernameError && (
                    <UsernameError>{usernameError}</UsernameError>
                  )}
                </UsernameForm>
              )}
            </UsernameRow>
          )}
        </UserInfo>
      </HeaderWrapper>
    )
  }

  if (!user) {
    return renderLoadingState()
  }

  return renderUserInfo()
}
