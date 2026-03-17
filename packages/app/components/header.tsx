import { Header as HeaderNav } from '@repo/ui/components/header/header'
import { Logo } from '@repo/ui/components/icons/logo'
import { useAuthType } from '@app/hooks/useAuthType'

export const Header = ({ cookies }: { cookies: any }) => {
  const { user, signOut } = useAuthType()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <HeaderNav
      navigation={[]}
      companyName={'Conjugame'}
      companyLogo={<Logo className="h-8 w-auto" />}
      companyLink={'/'}
      user={user}
      cookies={cookies}
      signOut={handleSignOut}
    />
  )
}
