import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  avatar_url: string | null
  slug: string | null
  username: string | null
  createdAt: Date
  updatedAt: Date
  role: string
  locale: string
  isTwoFactorEnabled: boolean
}

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO users (id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled")
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10)
RETURNING id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled"`

export interface CreateUserArgs {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export interface CreateUserRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function createUser(
  client: Client,
  args: CreateUserArgs,
): Promise<CreateUserRow | null> {
  const result = await client.query({
    text: createUserQuery,
    values: [
      args.id,
      args.name,
      args.email,
      args.emailverified,
      args.image,
      args.avatar_url,
      args.slug,
      args.role,
      args.locale,
      args.istwofactorenabled,
    ],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
  }
}

export const getUserQuery = `-- name: GetUser :one
SELECT id, name, email, "emailVerified", image, avatar_url, slug, username, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE id = $1 LIMIT 1`

export interface GetUserArgs {
  id: string
}

export interface GetUserRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  username: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function getUser(
  client: Client,
  args: GetUserArgs,
): Promise<GetUserRow | null> {
  const result = await client.query({
    text: getUserQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    username: row[7],
    createdat: row[8],
    updatedat: row[9],
    role: row[10],
    locale: row[11],
    istwofactorenabled: row[12],
  }
}

export const getUserBySlugQuery = `-- name: GetUserBySlug :one
SELECT id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE slug = $1 LIMIT 1`

export interface GetUserBySlugArgs {
  slug: string | null
}

export interface GetUserBySlugRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function getUserBySlug(
  client: Client,
  args: GetUserBySlugArgs,
): Promise<GetUserBySlugRow | null> {
  const result = await client.query({
    text: getUserBySlugQuery,
    values: [args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
  }
}

export const getUserByEmailQuery = `-- name: GetUserByEmail :one
SELECT id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE email = $1 LIMIT 1`

export interface GetUserByEmailArgs {
  email: string
}

export interface GetUserByEmailRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function getUserByEmail(
  client: Client,
  args: GetUserByEmailArgs,
): Promise<GetUserByEmailRow | null> {
  const result = await client.query({
    text: getUserByEmailQuery,
    values: [args.email],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
  }
}

export const getUsersByRoleQuery = `-- name: GetUsersByRole :many
SELECT id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE "role" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface GetUsersByRoleArgs {
  role: string | null
  limit: string
  offset: string
}

export interface GetUsersByRoleRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function getUsersByRole(
  client: Client,
  args: GetUsersByRoleArgs,
): Promise<GetUsersByRoleRow[]> {
  const result = await client.query({
    text: getUsersByRoleQuery,
    values: [args.role, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      name: row[1],
      email: row[2],
      emailverified: row[3],
      image: row[4],
      avatar_url: row[5],
      slug: row[6],
      createdat: row[7],
      updatedat: row[8],
      role: row[9],
      locale: row[10],
      istwofactorenabled: row[11],
    }
  })
}

export const getUserForUpdateQuery = `-- name: GetUserForUpdate :one
SELECT id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE id = $1 LIMIT 1 FOR NO KEY UPDATE`

export interface GetUserForUpdateArgs {
  id: string
}

export interface GetUserForUpdateRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function getUserForUpdate(
  client: Client,
  args: GetUserForUpdateArgs,
): Promise<GetUserForUpdateRow | null> {
  const result = await client.query({
    text: getUserForUpdateQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
  }
}

export const listUsersQuery = `-- name: ListUsers :many
SELECT id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users ORDER BY id LIMIT $1 OFFSET $2`

export interface ListUsersArgs {
  limit: string
  offset: string
}

export interface ListUsersRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function listUsers(
  client: Client,
  args: ListUsersArgs,
): Promise<ListUsersRow[]> {
  const result = await client.query({
    text: listUsersQuery,
    values: [args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      name: row[1],
      email: row[2],
      emailverified: row[3],
      image: row[4],
      avatar_url: row[5],
      slug: row[6],
      createdat: row[7],
      updatedat: row[8],
      role: row[9],
      locale: row[10],
      istwofactorenabled: row[11],
    }
  })
}

export const updateUserQuery = `-- name: UpdateUser :one
UPDATE users SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  "emailVerified" = COALESCE($4, "emailVerified"),
  image = COALESCE($5, image),
  avatar_url = COALESCE($6, avatar_url),
  slug = COALESCE($7, slug),
  "role" = COALESCE($8, "role"),
  "isTwoFactorEnabled" = COALESCE($9, "isTwoFactorEnabled"),
  "locale" = COALESCE($10, 'en'),
  username = COALESCE($11, username),
  "updatedAt" = NOW()
WHERE id = $1
RETURNING id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled", username`

export interface UpdateUserArgs {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  role: string | null
  istwofactorenabled: boolean | null
  locale: string | null
  username: string | null
}

export interface UpdateUserRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
  username: string | null
}

export async function updateUser(
  client: Client,
  args: UpdateUserArgs,
): Promise<UpdateUserRow | null> {
  const result = await client.query({
    text: updateUserQuery,
    values: [
      args.id,
      args.name,
      args.email,
      args.emailverified,
      args.image,
      args.avatar_url,
      args.slug,
      args.role,
      args.istwofactorenabled,
      args.locale,
      args.username,
    ],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
    username: row[12],
  }
}

export const updateUserLocaleQuery = `-- name: UpdateUserLocale :exec
UPDATE users
SET "locale" = COALESCE($2, 'en'),
    "updatedAt" = NOW()
WHERE id = $1`

export interface UpdateUserLocaleArgs {
  id: string
  locale: string | null
}

export async function updateUserLocale(
  client: Client,
  args: UpdateUserLocaleArgs,
): Promise<void> {
  await client.query({
    text: updateUserLocaleQuery,
    values: [args.id, args.locale],
    rowMode: 'array',
  })
}

export const updateUserEmailQuery = `-- name: UpdateUserEmail :one
UPDATE users SET
  email = $2,
  "emailVerified" = FALSE,
  "updatedAt" = NOW()
WHERE id = $1
RETURNING id, name, email, "emailVerified", image, avatar_url, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled"`

export interface UpdateUserEmailArgs {
  id: string
  email: string
}

export interface UpdateUserEmailRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  avatar_url: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function updateUserEmail(
  client: Client,
  args: UpdateUserEmailArgs,
): Promise<UpdateUserEmailRow | null> {
  const result = await client.query({
    text: updateUserEmailQuery,
    values: [args.id, args.email],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    emailverified: row[3],
    image: row[4],
    avatar_url: row[5],
    slug: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
  }
}

export const deleteUserQuery = `-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1`

export interface DeleteUserArgs {
  id: string
}

export async function deleteUser(
  client: Client,
  args: DeleteUserArgs,
): Promise<void> {
  await client.query({
    text: deleteUserQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const createSessionQuery = `-- name: CreateSession :one
INSERT INTO sessions (id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
RETURNING id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt"`

export interface CreateSessionArgs {
  id: string
  userid: string
  token: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
}

export interface CreateSessionRow {
  id: string
  userid: string
  token: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
  createdat: Date
  updatedat: Date
}

export async function createSession(
  client: Client,
  args: CreateSessionArgs,
): Promise<CreateSessionRow | null> {
  const result = await client.query({
    text: createSessionQuery,
    values: [
      args.id,
      args.userid,
      args.token,
      args.expiresat,
      args.ipaddress,
      args.useragent,
    ],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    token: row[2],
    expiresat: row[3],
    ipaddress: row[4],
    useragent: row[5],
    createdat: row[6],
    updatedat: row[7],
  }
}
