'use client'
import UserDropdown from './user-dropdown'
import { User } from '@auth/core/types'

type UserWithUsername = User & { username?: string | null }

export const UserButton = ({
  user,
  signOut,
}: {
  user: UserWithUsername | undefined
  signOut: () => Promise<void>
}) => {
  return user ? (
    <UserDropdown user={user} logOut={signOut} />
  ) : (
    <a href="/signin" className="text-sm font-semibold leading-6 text-white">
      Log in <span aria-hidden="true">&rarr;</span>
    </a>
  )
}
