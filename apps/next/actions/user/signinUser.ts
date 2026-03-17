'use server'

import { auth } from '../../auth'
import { LoginSchema, loginSchema } from '@repo/schema/login'
import { headers } from 'next/headers'

export const signInUser = async ({
  signInType,
  values,
  callbackUrl,
}: {
  signInType?: string
  values: loginSchema
  callbackUrl?: string
}) => {
  const validatedFields = LoginSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' }
  }

  const { email, password } = validatedFields.data

  try {
    const headersList = await headers()

    // Call better-auth sign in
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: callbackUrl,
        rememberMe: true,
      },
      headers: headersList,
    })

    if (!response) {
      return { error: 'Invalid credentials!' }
    }

    return {
      success: 'Signed in successfully!',
      data: response,
    }
  } catch (error: any) {
    console.error('Sign in error:', error)

    if (
      error.message?.includes('Email not verified') ||
      error.message?.includes('email_not_verified')
    ) {
      return {
        headline: 'Check your email',
        error:
          'Your email is not yet verified. Check your email and click on the link to get verified!',
      }
    }

    if (
      error.message?.includes('Invalid') ||
      error.message?.includes('credentials')
    ) {
      return { error: 'Invalid credentials!' }
    }

    return { error: error.message || 'Something went wrong!' }
  }
}
