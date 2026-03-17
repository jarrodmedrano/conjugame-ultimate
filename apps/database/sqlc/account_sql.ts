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
  avatar_url?: string | null
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
      args.avatar_url ?? null,
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

export const getUserByUsernameQuery = `SELECT id, name, email, "emailVerified", image, avatar_url, slug, username, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE username = $1 LIMIT 1`

export interface GetUserByUsernameArgs {
  username: string
}

export interface GetUserByUsernameRow {
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

export async function getUserByUsername(
  client: Client,
  args: GetUserByUsernameArgs,
): Promise<GetUserByUsernameRow | null> {
  const result = await client.query({
    text: getUserByUsernameQuery,
    values: [args.username],
    rowMode: 'array',
  })
  if (result.rows.length === 0) {
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

export const checkUsernameExistsQuery = `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS exists`

export interface CheckUsernameExistsRow {
  exists: boolean
}

export async function checkUsernameExists(
  client: Client,
  args: { username: string },
): Promise<CheckUsernameExistsRow> {
  const result = await client.query({
    text: checkUsernameExistsQuery,
    values: [args.username],
    rowMode: 'array',
  })
  return { exists: result.rows[0][0] }
}

export const createVerificationQuery = `-- name: CreateVerification :one
INSERT INTO verifications (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING id, identifier, value, "expiresAt", "createdAt", "updatedAt"`

export interface CreateVerificationArgs {
  id: string
  identifier: string
  value: string
  expiresat: Date
}

export interface VerificationRow {
  id: string
  identifier: string
  value: string
  expiresat: Date
  createdat: Date
  updatedat: Date
}

// Type aliases for named query row types
export type GetVerificationRow = VerificationRow
export type GetVerificationByValueRow = VerificationRow
export type GetVerificationByIdRow = VerificationRow

export async function createVerification(
  client: Client,
  args: CreateVerificationArgs,
): Promise<VerificationRow | null> {
  const result = await client.query({
    text: createVerificationQuery,
    values: [args.id, args.identifier, args.value, args.expiresat],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    identifier: row[1],
    value: row[2],
    expiresat: row[3],
    createdat: row[4],
    updatedat: row[5],
  }
}

export const getVerificationQuery = `-- name: GetVerification :one
SELECT id, identifier, value, "expiresAt", "createdAt", "updatedAt" FROM verifications WHERE identifier = $1 AND value = $2 LIMIT 1`

export interface GetVerificationArgs {
  identifier: string
  value: string
}

export async function getVerification(
  client: Client,
  args: GetVerificationArgs,
): Promise<VerificationRow | null> {
  const result = await client.query({
    text: getVerificationQuery,
    values: [args.identifier, args.value],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    identifier: row[1],
    value: row[2],
    expiresat: row[3],
    createdat: row[4],
    updatedat: row[5],
  }
}

export const getVerificationByValueQuery = `-- name: GetVerificationByValue :one
SELECT id, identifier, value, "expiresAt", "createdAt", "updatedAt" FROM verifications WHERE value = $1 LIMIT 1`

export interface GetVerificationByValueArgs {
  value: string
}

export async function getVerificationByValue(
  client: Client,
  args: GetVerificationByValueArgs,
): Promise<VerificationRow | null> {
  const result = await client.query({
    text: getVerificationByValueQuery,
    values: [args.value],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    identifier: row[1],
    value: row[2],
    expiresat: row[3],
    createdat: row[4],
    updatedat: row[5],
  }
}

export const getVerificationByIdQuery = `-- name: GetVerificationById :one
SELECT id, identifier, value, "expiresAt", "createdAt", "updatedAt" FROM verifications WHERE id = $1 LIMIT 1`

export interface GetVerificationByIdArgs {
  id: string
}

export async function getVerificationById(
  client: Client,
  args: GetVerificationByIdArgs,
): Promise<VerificationRow | null> {
  const result = await client.query({
    text: getVerificationByIdQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    identifier: row[1],
    value: row[2],
    expiresat: row[3],
    createdat: row[4],
    updatedat: row[5],
  }
}

export const deleteVerificationQuery = `-- name: DeleteVerification :exec
DELETE FROM verifications WHERE id = $1`

export interface DeleteVerificationArgs {
  id: string
}

export async function deleteVerification(
  client: Client,
  args: DeleteVerificationArgs,
): Promise<void> {
  await client.query({
    text: deleteVerificationQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const deleteExpiredVerificationsQuery = `-- name: DeleteExpiredVerifications :exec
DELETE FROM verifications WHERE "expiresAt" < NOW()`

export async function deleteExpiredVerifications(
  client: Client,
): Promise<void> {
  await client.query({
    text: deleteExpiredVerificationsQuery,
    values: [],
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

export const createAccountQuery = `-- name: CreateAccount :one
INSERT INTO accounts (id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
RETURNING id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt"`

export interface CreateAccountArgs {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  idtoken: string | null
  scope: string | null
  password: string | null
}

export interface AccountRow {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  idtoken: string | null
  scope: string | null
  password: string | null
  createdat: Date
  updatedat: Date
}

export type CreateAccountRow = AccountRow

export async function createAccount(
  client: Client,
  args: CreateAccountArgs,
): Promise<AccountRow | null> {
  const result = await client.query({
    text: createAccountQuery,
    values: [
      args.id,
      args.userid,
      args.accountid,
      args.providerid,
      args.accesstoken,
      args.refreshtoken,
      args.accesstokenexpiresat,
      args.refreshtokenexpiresat,
      args.idtoken,
      args.scope,
      args.password,
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
    accountid: row[2],
    providerid: row[3],
    accesstoken: row[4],
    refreshtoken: row[5],
    accesstokenexpiresat: row[6],
    refreshtokenexpiresat: row[7],
    idtoken: row[8],
    scope: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
}

export const getAccountQuery = `-- name: GetAccount :one
SELECT id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt" FROM accounts WHERE id = $1 LIMIT 1`

export interface GetAccountArgs {
  id: string
}

export type GetAccountRow = AccountRow

export async function getAccount(
  client: Client,
  args: GetAccountArgs,
): Promise<AccountRow | null> {
  const result = await client.query({
    text: getAccountQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    accountid: row[2],
    providerid: row[3],
    accesstoken: row[4],
    refreshtoken: row[5],
    accesstokenexpiresat: row[6],
    refreshtokenexpiresat: row[7],
    idtoken: row[8],
    scope: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
}

export const getAccountByProviderQuery = `-- name: GetAccountByProvider :one
SELECT id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt" FROM accounts WHERE "userId" = $1 AND "providerId" = $2 LIMIT 1`

export interface GetAccountByProviderArgs {
  userid: string
  providerid: string
}

export type GetAccountByProviderRow = AccountRow

export async function getAccountByProvider(
  client: Client,
  args: GetAccountByProviderArgs,
): Promise<AccountRow | null> {
  const result = await client.query({
    text: getAccountByProviderQuery,
    values: [args.userid, args.providerid],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    accountid: row[2],
    providerid: row[3],
    accesstoken: row[4],
    refreshtoken: row[5],
    accesstokenexpiresat: row[6],
    refreshtokenexpiresat: row[7],
    idtoken: row[8],
    scope: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
}

export const listAccountsForUserQuery = `-- name: ListAccountsForUser :many
SELECT id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt" FROM accounts WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface ListAccountsForUserArgs {
  userid: string
  limit: string
  offset: string
}

export type ListAccountsForUserRow = AccountRow

export async function listAccountsForUser(
  client: Client,
  args: ListAccountsForUserArgs,
): Promise<AccountRow[]> {
  const result = await client.query({
    text: listAccountsForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => ({
    id: row[0],
    userid: row[1],
    accountid: row[2],
    providerid: row[3],
    accesstoken: row[4],
    refreshtoken: row[5],
    accesstokenexpiresat: row[6],
    refreshtokenexpiresat: row[7],
    idtoken: row[8],
    scope: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }))
}

export const deleteAccountQuery = `-- name: DeleteAccount :exec
DELETE FROM accounts WHERE id = $1`

export interface DeleteAccountArgs {
  id: string
}

export async function deleteAccount(
  client: Client,
  args: DeleteAccountArgs,
): Promise<void> {
  await client.query({
    text: deleteAccountQuery,
    values: [args.id],
    rowMode: 'array',
  })
}
