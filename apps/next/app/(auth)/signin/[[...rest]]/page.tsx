import { SigninFormCard } from '@repo/ui/components/pages/signin'
import { signOut } from '../../../../auth'
import { signInUser } from '../../../../actions/user/signinUser'

export type Provider = {
  id: string
  name: string
  type: string
  style: {
    logo: string
    bg: string
    text: string
  }
}

// Get configured social providers from better-auth
function getProviders(): Provider[] {
  // For now, return empty array - providers will be handled differently in better-auth
  // You can add social providers when they're configured
  return []
}

const SigninPage = () => {
  const providers = getProviders()

  const handleSignOut = async () => {
    'use server'
    await signOut()
  }

  return (
    <SigninFormCard
      signOut={handleSignOut}
      credentialsSignin={signInUser}
      providers={providers}
      credentials
    />
  )
}

export default SigninPage
