'use server'

import { auth } from '../../auth'
import { RegisterSchema, registerSchema } from '@repo/schema/register'
import checkUsernameAvailable from './checkUsernameAvailable'

export const registerUser = async ({
  values,
  callbackUrl,
}: {
  signInType?: string
  values: registerSchema
  callbackUrl?: string | null
}) => {
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' }
  }

  const { email, password, name, username } = validatedFields.data

  const usernameCheck = await checkUsernameAvailable({ username })
  if (!usernameCheck.available) {
    return { error: usernameCheck.error ?? 'Username is already taken!' }
  }

  try {
    // Call better-auth sign up.
    // username is an additionalField defined in auth config and will be
    // persisted by Better Auth at runtime; cast bypasses strict type checking
    // since Better Auth's generated types don't include additionalFields in body.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (auth.api.signUpEmail as any)({
      body: {
        email,
        password,
        name,
        username,
        callbackURL: callbackUrl || undefined,
      },
    })

    if (!response) {
      return { error: 'Failed to create account!' }
    }

    return {
      headline: 'Check your email',
      success:
        'We sent a verification link to your email address. Click it to activate your account.',
    }
  } catch (error: any) {
    console.error('Registration error:', error)

    if (
      error.message?.includes('already exists') ||
      error.message?.includes('duplicate') ||
      error.message?.includes('unique')
    ) {
      return { error: 'Email already in use!' }
    }

    return { error: error.message || 'Something went wrong!' }
  }

  return { success: 'Confirmation email sent!' }
}
