'use server'

import fetchUserByEmail from './getUserByEmail'
import updateUser from './updateUser'
import fetchVerificationByValue from './getVerificationByValue'
import deleteToken from './deleteVerificationToken'

export const newVerification = async (token: string) => {
  const existingToken = await fetchVerificationByValue({
    value: token,
  })

  if (!existingToken) {
    return { error: 'Token does not exist!' }
  }

  const hasExpired = new Date(existingToken.expiresat) < new Date()

  if (hasExpired) {
    return { error: 'Token has expired!' }
  }

  const existingUser = await fetchUserByEmail({
    email: existingToken.identifier,
  })

  if (!existingUser) {
    return { error: 'Email does not exist!' }
  }

  await updateUser({
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    emailverified: true,
    image: existingUser.image,
    slug: existingUser.slug,
    role: existingUser.role,
    istwofactorenabled: existingUser.istwofactorenabled,
    locale: existingUser.locale,
    username: null,
  })

  await deleteToken({
    id: existingToken.id,
  })

  return { success: 'Email verified!' }
}
