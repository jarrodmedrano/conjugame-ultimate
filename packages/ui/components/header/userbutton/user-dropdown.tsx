import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
const links = ['stories', 'characters', 'locations', 'timelines']
import { User } from '@auth/core/types'

type UserWithUsername = User & { username?: string | null }

const UserLinks: ({ user }: { user: UserWithUsername }) => JSX.Element = ({
  user,
}: {
  user: UserWithUsername
}) => {
  const handle = user?.username || user?.id
  return (
    <>
      {links.map((link) => {
        return (
          <a key={'user' + link} href={`/${handle}/${link}`}>
            <DropdownMenuItem>{link}</DropdownMenuItem>
          </a>
        )
      })}
    </>
  )
}

const CreateLinks = () => {
  return (
    <>
      {links.map((link) => {
        return (
          <a key={'create' + link} href={`/create/${link}`}>
            <DropdownMenuItem>{link}</DropdownMenuItem>
          </a>
        )
      })}
    </>
  )
}

const UserDropdown = ({
  user,
  logOut,
}: {
  user: UserWithUsername
  logOut: () => void
}) => {
  const handle = user?.username || user?.id
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
          <AvatarFallback>{user?.name?.split('')[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <a href={`/${handle}`}>
            <DropdownMenuItem>Profile</DropdownMenuItem>
          </a>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UserLinks user={user} />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Create New</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <CreateLinks />
                <DropdownMenuSeparator />
                <a href={`/create/`}>
                  <DropdownMenuItem>More...</DropdownMenuItem>
                </a>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logOut}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
