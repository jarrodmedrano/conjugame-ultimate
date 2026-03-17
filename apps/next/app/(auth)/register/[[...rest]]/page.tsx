import { RegisterFormCard } from '@repo/ui/components/pages/register'
import { signOut } from '@next-app/auth'
import { registerUser } from '@next-app/actions/user/registerUser'

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

const RegisterPage = () => {
  const providers = getProviders()

  const handleSignOut = async () => {
    'use server'
    await signOut()
  }

  return (
    <RegisterFormCard
      signOut={handleSignOut}
      credentialsRegister={registerUser}
      providers={providers}
      credentials
    />
  )
}

export default RegisterPage
