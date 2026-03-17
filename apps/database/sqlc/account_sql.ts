import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO users (id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled")
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9)
RETURNING id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled"`

export interface CreateUserArgs {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
  }
}

export const getUserQuery = `-- name: GetUser :one
SELECT id, name, email, "emailVerified", image, slug, username, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE id = $1 LIMIT 1`

export interface GetUserArgs {
  id: string
}

export interface GetUserRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
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
    slug: row[5],
    username: row[6],
    createdat: row[7],
    updatedat: row[8],
    role: row[9],
    locale: row[10],
    istwofactorenabled: row[11],
  }
}

export const getUserBySlugQuery = `-- name: GetUserBySlug :one
SELECT id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE slug = $1 LIMIT 1`

export interface GetUserBySlugArgs {
  slug: string | null
}

export interface GetUserBySlugRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
  }
}

export const getUserByEmailQuery = `-- name: GetUserByEmail :one
SELECT id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE email = $1 LIMIT 1`

export interface GetUserByEmailArgs {
  email: string
}

export interface GetUserByEmailRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
  }
}

export const getUsersByRoleQuery = `-- name: GetUsersByRole :many
SELECT id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE "role" = $1 ORDER BY id LIMIT $2 OFFSET $3`

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
      slug: row[5],
      createdat: row[6],
      updatedat: row[7],
      role: row[8],
      locale: row[9],
      istwofactorenabled: row[10],
    }
  })
}

export const getUserForUpdateQuery = `-- name: GetUserForUpdate :one
SELECT id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users WHERE id = $1 LIMIT 1 FOR NO KEY UPDATE`

export interface GetUserForUpdateArgs {
  id: string
}

export interface GetUserForUpdateRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
  }
}

export const listUsersQuery = `-- name: ListUsers :many
SELECT id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled" FROM users ORDER BY id LIMIT $1 OFFSET $2`

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
      slug: row[5],
      createdat: row[6],
      updatedat: row[7],
      role: row[8],
      locale: row[9],
      istwofactorenabled: row[10],
    }
  })
}

export const updateUserQuery = `-- name: UpdateUser :one
UPDATE users SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  "emailVerified" = COALESCE($4, "emailVerified"),
  image = COALESCE($5, image),
  slug = COALESCE($6, slug),
  "role" = COALESCE($7, "role"),
  "isTwoFactorEnabled" = COALESCE($8, "isTwoFactorEnabled"),
  "locale" = COALESCE($9, 'en'),
  username = COALESCE($10, username),
  "updatedAt" = NOW()
WHERE id = $1
RETURNING id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled", username`

export interface UpdateUserArgs {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
    username: row[11],
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
  "emailVerified" = FALSE, -- reset emailVerified when changing email
  "updatedAt" = NOW()
WHERE id = $1 
RETURNING id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled"`

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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
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

export const getSessionQuery = `-- name: GetSession :one
SELECT id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt" FROM sessions WHERE token = $1 LIMIT 1`

export interface GetSessionArgs {
  token: string
}

export interface GetSessionRow {
  id: string
  userid: string
  token: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
  createdat: Date
  updatedat: Date
}

export async function getSession(
  client: Client,
  args: GetSessionArgs,
): Promise<GetSessionRow | null> {
  const result = await client.query({
    text: getSessionQuery,
    values: [args.token],
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

export const getSessionByIdQuery = `-- name: GetSessionById :one
SELECT id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt" FROM sessions WHERE id = $1 LIMIT 1`

export interface GetSessionByIdArgs {
  id: string
}

export interface GetSessionByIdRow {
  id: string
  userid: string
  token: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
  createdat: Date
  updatedat: Date
}

export async function getSessionById(
  client: Client,
  args: GetSessionByIdArgs,
): Promise<GetSessionByIdRow | null> {
  const result = await client.query({
    text: getSessionByIdQuery,
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
    token: row[2],
    expiresat: row[3],
    ipaddress: row[4],
    useragent: row[5],
    createdat: row[6],
    updatedat: row[7],
  }
}

export const listSessionsForUserQuery = `-- name: ListSessionsForUser :many
SELECT id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt" FROM sessions WHERE "userId" = $1 ORDER BY "expiresAt" DESC LIMIT $2 OFFSET $3`

export interface ListSessionsForUserArgs {
  userid: string
  limit: string
  offset: string
}

export interface ListSessionsForUserRow {
  id: string
  userid: string
  token: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
  createdat: Date
  updatedat: Date
}

export async function listSessionsForUser(
  client: Client,
  args: ListSessionsForUserArgs,
): Promise<ListSessionsForUserRow[]> {
  const result = await client.query({
    text: listSessionsForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
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
  })
}

export const updateSessionQuery = `-- name: UpdateSession :one
UPDATE sessions SET 
  "expiresAt" = COALESCE($2, "expiresAt"),
  "ipAddress" = COALESCE($3, "ipAddress"),
  "userAgent" = COALESCE($4, "userAgent"),
  "updatedAt" = NOW()
WHERE id = $1 
RETURNING id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt"`

export interface UpdateSessionArgs {
  id: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
}

export interface UpdateSessionRow {
  id: string
  userid: string
  token: string
  expiresat: Date
  ipaddress: string | null
  useragent: string | null
  createdat: Date
  updatedat: Date
}

export async function updateSession(
  client: Client,
  args: UpdateSessionArgs,
): Promise<UpdateSessionRow | null> {
  const result = await client.query({
    text: updateSessionQuery,
    values: [args.id, args.expiresat, args.ipaddress, args.useragent],
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

export const deleteSessionQuery = `-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = $1`

export interface DeleteSessionArgs {
  token: string
}

export async function deleteSession(
  client: Client,
  args: DeleteSessionArgs,
): Promise<void> {
  await client.query({
    text: deleteSessionQuery,
    values: [args.token],
    rowMode: 'array',
  })
}

export const deleteSessionByIdQuery = `-- name: DeleteSessionById :exec
DELETE FROM sessions WHERE id = $1`

export interface DeleteSessionByIdArgs {
  id: string
}

export async function deleteSessionById(
  client: Client,
  args: DeleteSessionByIdArgs,
): Promise<void> {
  await client.query({
    text: deleteSessionByIdQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const createAccountQuery = `-- name: CreateAccount :one
INSERT INTO accounts (id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
RETURNING id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, "idToken", password, "createdAt", "updatedAt"`

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

export interface CreateAccountRow {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  scope: string | null
  idtoken: string | null
  password: string | null
  createdat: Date
  updatedat: Date
}

export async function createAccount(
  client: Client,
  args: CreateAccountArgs,
): Promise<CreateAccountRow | null> {
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
    scope: row[8],
    idtoken: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
}

export const getAccountQuery = `-- name: GetAccount :one
SELECT id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, "idToken", password, "createdAt", "updatedAt" FROM accounts WHERE id = $1 LIMIT 1`

export interface GetAccountArgs {
  id: string
}

export interface GetAccountRow {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  scope: string | null
  idtoken: string | null
  password: string | null
  createdat: Date
  updatedat: Date
}

export async function getAccount(
  client: Client,
  args: GetAccountArgs,
): Promise<GetAccountRow | null> {
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
    scope: row[8],
    idtoken: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
}

export const getAccountByProviderQuery = `-- name: GetAccountByProvider :one
SELECT id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, "idToken", password, "createdAt", "updatedAt" FROM accounts WHERE "userId" = $1 AND "providerId" = $2 LIMIT 1`

export interface GetAccountByProviderArgs {
  userid: string
  providerid: string
}

export interface GetAccountByProviderRow {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  scope: string | null
  idtoken: string | null
  password: string | null
  createdat: Date
  updatedat: Date
}

export async function getAccountByProvider(
  client: Client,
  args: GetAccountByProviderArgs,
): Promise<GetAccountByProviderRow | null> {
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
    scope: row[8],
    idtoken: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
}

export const listAccountsForUserQuery = `-- name: ListAccountsForUser :many
SELECT id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, "idToken", password, "createdAt", "updatedAt" FROM accounts WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface ListAccountsForUserArgs {
  userid: string
  limit: string
  offset: string
}

export interface ListAccountsForUserRow {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  scope: string | null
  idtoken: string | null
  password: string | null
  createdat: Date
  updatedat: Date
}

export async function listAccountsForUser(
  client: Client,
  args: ListAccountsForUserArgs,
): Promise<ListAccountsForUserRow[]> {
  const result = await client.query({
    text: listAccountsForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      accountid: row[2],
      providerid: row[3],
      accesstoken: row[4],
      refreshtoken: row[5],
      accesstokenexpiresat: row[6],
      refreshtokenexpiresat: row[7],
      scope: row[8],
      idtoken: row[9],
      password: row[10],
      createdat: row[11],
      updatedat: row[12],
    }
  })
}

export const updateAccountQuery = `-- name: UpdateAccount :one
UPDATE accounts SET 
  "accessToken" = COALESCE($2, "accessToken"),
  "refreshToken" = COALESCE($3, "refreshToken"),
  "accessTokenExpiresAt" = COALESCE($4, "accessTokenExpiresAt"),
  "refreshTokenExpiresAt" = COALESCE($5, "refreshTokenExpiresAt"),
  "idToken" = COALESCE($6, "idToken"),
  scope = COALESCE($7, scope),
  password = COALESCE($8, password),
  "updatedAt" = NOW()
WHERE id = $1 
RETURNING id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, "idToken", password, "createdAt", "updatedAt"`

export interface UpdateAccountArgs {
  id: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  idtoken: string | null
  scope: string | null
  password: string | null
}

export interface UpdateAccountRow {
  id: string
  userid: string
  accountid: string
  providerid: string
  accesstoken: string | null
  refreshtoken: string | null
  accesstokenexpiresat: Date | null
  refreshtokenexpiresat: Date | null
  scope: string | null
  idtoken: string | null
  password: string | null
  createdat: Date
  updatedat: Date
}

export async function updateAccount(
  client: Client,
  args: UpdateAccountArgs,
): Promise<UpdateAccountRow | null> {
  const result = await client.query({
    text: updateAccountQuery,
    values: [
      args.id,
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
    scope: row[8],
    idtoken: row[9],
    password: row[10],
    createdat: row[11],
    updatedat: row[12],
  }
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

export interface CreateVerificationRow {
  id: string
  identifier: string
  value: string
  expiresat: Date
  createdat: Date
  updatedat: Date
}

export async function createVerification(
  client: Client,
  args: CreateVerificationArgs,
): Promise<CreateVerificationRow | null> {
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

export interface GetVerificationRow {
  id: string
  identifier: string
  value: string
  expiresat: Date
  createdat: Date
  updatedat: Date
}

export async function getVerification(
  client: Client,
  args: GetVerificationArgs,
): Promise<GetVerificationRow | null> {
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

export interface GetVerificationByValueRow {
  id: string
  identifier: string
  value: string
  expiresat: Date
  createdat: Date
  updatedat: Date
}

export async function getVerificationByValue(
  client: Client,
  args: GetVerificationByValueArgs,
): Promise<GetVerificationByValueRow | null> {
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

export interface GetVerificationByIdRow {
  id: string
  identifier: string
  value: string
  expiresat: Date
  createdat: Date
  updatedat: Date
}

export async function getVerificationById(
  client: Client,
  args: GetVerificationByIdArgs,
): Promise<GetVerificationByIdRow | null> {
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

export const createStoryQuery = `-- name: CreateStory :one
INSERT INTO stories ("userId", title, content, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, "userId", title, content, slug, privacy, created_at, updated_at`

export interface CreateStoryArgs {
  userid: string
  title: string
  content: string
  privacy: string
  slug: string | null
}

export interface CreateStoryRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function createStory(
  client: Client,
  args: CreateStoryArgs,
): Promise<CreateStoryRow | null> {
  const result = await client.query({
    text: createStoryQuery,
    values: [args.userid, args.title, args.content, args.privacy, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    title: row[2],
    content: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getStoryQuery = `-- name: GetStory :one
SELECT id, "userId", title, content, slug, privacy, created_at, updated_at FROM stories WHERE id = $1 LIMIT 1`

export interface GetStoryArgs {
  id: number
}

export interface GetStoryRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getStory(
  client: Client,
  args: GetStoryArgs,
): Promise<GetStoryRow | null> {
  const result = await client.query({
    text: getStoryQuery,
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
    title: row[2],
    content: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getStoryBySlugQuery = `-- name: GetStoryBySlug :one
SELECT id, "userId", title, content, slug, privacy, created_at, updated_at FROM stories WHERE "userId" = $1 AND slug = $2 LIMIT 1`

export interface GetStoryBySlugArgs {
  userid: string
  slug: string | null
}

export interface GetStoryBySlugRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getStoryBySlug(
  client: Client,
  args: GetStoryBySlugArgs,
): Promise<GetStoryBySlugRow | null> {
  const result = await client.query({
    text: getStoryBySlugQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    title: row[2],
    content: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const checkStorySlugExistsQuery = `-- name: CheckStorySlugExists :one
SELECT EXISTS(SELECT 1 FROM stories WHERE "userId" = $1 AND slug = $2) AS exists`

export interface CheckStorySlugExistsArgs {
  userid: string
  slug: string | null
}

export interface CheckStorySlugExistsRow {
  exists: boolean
}

export async function checkStorySlugExists(
  client: Client,
  args: CheckStorySlugExistsArgs,
): Promise<CheckStorySlugExistsRow | null> {
  const result = await client.query({
    text: checkStorySlugExistsQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    exists: row[0],
  }
}

export const listStoriesForUserQuery = `-- name: ListStoriesForUser :many
SELECT id, "userId", title, content, slug, privacy, created_at, updated_at FROM stories WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface ListStoriesForUserArgs {
  userid: string
  limit: string
  offset: string
}

export interface ListStoriesForUserRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listStoriesForUser(
  client: Client,
  args: ListStoriesForUserArgs,
): Promise<ListStoriesForUserRow[]> {
  const result = await client.query({
    text: listStoriesForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      title: row[2],
      content: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const listStoriesForUserWithPrivacyQuery = `-- name: ListStoriesForUserWithPrivacy :many
SELECT id, "userId", title, content, slug, privacy, created_at, updated_at FROM stories
WHERE "userId" = $1
  AND (privacy = 'public' OR $2::boolean = true)
ORDER BY created_at DESC`

export interface ListStoriesForUserWithPrivacyArgs {
  ownerId: string
  isOwner: boolean
}

export interface ListStoriesForUserWithPrivacyRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listStoriesForUserWithPrivacy(
  client: Client,
  args: ListStoriesForUserWithPrivacyArgs,
): Promise<ListStoriesForUserWithPrivacyRow[]> {
  const result = await client.query({
    text: listStoriesForUserWithPrivacyQuery,
    values: [args.ownerId, args.isOwner],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      title: row[2],
      content: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const updateStoryQuery = `-- name: UpdateStory :one
UPDATE stories SET title = $2, content = $3, updated_at = NOW()
WHERE id = $1 RETURNING id, "userId", title, content, slug, privacy, created_at, updated_at`

export interface UpdateStoryArgs {
  id: number
  title: string
  content: string
}

export interface UpdateStoryRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateStory(
  client: Client,
  args: UpdateStoryArgs,
): Promise<UpdateStoryRow | null> {
  const result = await client.query({
    text: updateStoryQuery,
    values: [args.id, args.title, args.content],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    title: row[2],
    content: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const updateStoryPrivacyQuery = `-- name: UpdateStoryPrivacy :one
UPDATE stories
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, "userId", title, content, slug, privacy, created_at, updated_at`

export interface UpdateStoryPrivacyArgs {
  id: number
  privacy: string
}

export interface UpdateStoryPrivacyRow {
  id: number
  userid: string
  title: string
  content: string
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateStoryPrivacy(
  client: Client,
  args: UpdateStoryPrivacyArgs,
): Promise<UpdateStoryPrivacyRow | null> {
  const result = await client.query({
    text: updateStoryPrivacyQuery,
    values: [args.id, args.privacy],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    title: row[2],
    content: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const deleteStoryQuery = `-- name: DeleteStory :exec
DELETE FROM stories WHERE id = $1`

export interface DeleteStoryArgs {
  id: number
}

export async function deleteStory(
  client: Client,
  args: DeleteStoryArgs,
): Promise<void> {
  await client.query({
    text: deleteStoryQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const createCharacterQuery = `-- name: CreateCharacter :one
INSERT INTO characters ("userId", name, description, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface CreateCharacterArgs {
  userid: string
  name: string
  description: string | null
  privacy: string
  slug: string | null
}

export interface CreateCharacterRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function createCharacter(
  client: Client,
  args: CreateCharacterArgs,
): Promise<CreateCharacterRow | null> {
  const result = await client.query({
    text: createCharacterQuery,
    values: [args.userid, args.name, args.description, args.privacy, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getCharacterQuery = `-- name: GetCharacter :one
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM characters WHERE id = $1 LIMIT 1`

export interface GetCharacterArgs {
  id: number
}

export interface GetCharacterRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getCharacter(
  client: Client,
  args: GetCharacterArgs,
): Promise<GetCharacterRow | null> {
  const result = await client.query({
    text: getCharacterQuery,
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
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getCharacterBySlugQuery = `-- name: GetCharacterBySlug :one
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM characters WHERE "userId" = $1 AND slug = $2 LIMIT 1`

export interface GetCharacterBySlugArgs {
  userid: string
  slug: string | null
}

export interface GetCharacterBySlugRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getCharacterBySlug(
  client: Client,
  args: GetCharacterBySlugArgs,
): Promise<GetCharacterBySlugRow | null> {
  const result = await client.query({
    text: getCharacterBySlugQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const checkCharacterSlugExistsQuery = `-- name: CheckCharacterSlugExists :one
SELECT EXISTS(SELECT 1 FROM characters WHERE "userId" = $1 AND slug = $2) AS exists`

export interface CheckCharacterSlugExistsArgs {
  userid: string
  slug: string | null
}

export interface CheckCharacterSlugExistsRow {
  exists: boolean
}

export async function checkCharacterSlugExists(
  client: Client,
  args: CheckCharacterSlugExistsArgs,
): Promise<CheckCharacterSlugExistsRow | null> {
  const result = await client.query({
    text: checkCharacterSlugExistsQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    exists: row[0],
  }
}

export const listCharactersForUserQuery = `-- name: ListCharactersForUser :many
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM characters WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface ListCharactersForUserArgs {
  userid: string
  limit: string
  offset: string
}

export interface ListCharactersForUserRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listCharactersForUser(
  client: Client,
  args: ListCharactersForUserArgs,
): Promise<ListCharactersForUserRow[]> {
  const result = await client.query({
    text: listCharactersForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const listCharactersForUserWithPrivacyQuery = `-- name: ListCharactersForUserWithPrivacy :many
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM characters
WHERE "userId" = $1
  AND (privacy = 'public' OR $2::boolean = true)
ORDER BY created_at DESC`

export interface ListCharactersForUserWithPrivacyArgs {
  ownerId: string
  isOwner: boolean
}

export interface ListCharactersForUserWithPrivacyRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listCharactersForUserWithPrivacy(
  client: Client,
  args: ListCharactersForUserWithPrivacyArgs,
): Promise<ListCharactersForUserWithPrivacyRow[]> {
  const result = await client.query({
    text: listCharactersForUserWithPrivacyQuery,
    values: [args.ownerId, args.isOwner],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const updateCharacterQuery = `-- name: UpdateCharacter :one
UPDATE characters SET name = $2, description = $3, updated_at = NOW()
WHERE id = $1 RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface UpdateCharacterArgs {
  id: number
  name: string
  description: string | null
}

export interface UpdateCharacterRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateCharacter(
  client: Client,
  args: UpdateCharacterArgs,
): Promise<UpdateCharacterRow | null> {
  const result = await client.query({
    text: updateCharacterQuery,
    values: [args.id, args.name, args.description],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const updateCharacterPrivacyQuery = `-- name: UpdateCharacterPrivacy :one
UPDATE characters
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface UpdateCharacterPrivacyArgs {
  id: number
  privacy: string
}

export interface UpdateCharacterPrivacyRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateCharacterPrivacy(
  client: Client,
  args: UpdateCharacterPrivacyArgs,
): Promise<UpdateCharacterPrivacyRow | null> {
  const result = await client.query({
    text: updateCharacterPrivacyQuery,
    values: [args.id, args.privacy],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const deleteCharacterQuery = `-- name: DeleteCharacter :exec
DELETE FROM characters WHERE id = $1`

export interface DeleteCharacterArgs {
  id: number
}

export async function deleteCharacter(
  client: Client,
  args: DeleteCharacterArgs,
): Promise<void> {
  await client.query({
    text: deleteCharacterQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const createLocationQuery = `-- name: CreateLocation :one
INSERT INTO locations ("userId", name, description, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface CreateLocationArgs {
  userid: string
  name: string
  description: string | null
  privacy: string
  slug: string | null
}

export interface CreateLocationRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function createLocation(
  client: Client,
  args: CreateLocationArgs,
): Promise<CreateLocationRow | null> {
  const result = await client.query({
    text: createLocationQuery,
    values: [args.userid, args.name, args.description, args.privacy, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getLocationQuery = `-- name: GetLocation :one
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM locations WHERE id = $1 LIMIT 1`

export interface GetLocationArgs {
  id: number
}

export interface GetLocationRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getLocation(
  client: Client,
  args: GetLocationArgs,
): Promise<GetLocationRow | null> {
  const result = await client.query({
    text: getLocationQuery,
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
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getLocationBySlugQuery = `-- name: GetLocationBySlug :one
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM locations WHERE "userId" = $1 AND slug = $2 LIMIT 1`

export interface GetLocationBySlugArgs {
  userid: string
  slug: string | null
}

export interface GetLocationBySlugRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getLocationBySlug(
  client: Client,
  args: GetLocationBySlugArgs,
): Promise<GetLocationBySlugRow | null> {
  const result = await client.query({
    text: getLocationBySlugQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const checkLocationSlugExistsQuery = `-- name: CheckLocationSlugExists :one
SELECT EXISTS(SELECT 1 FROM locations WHERE "userId" = $1 AND slug = $2) AS exists`

export interface CheckLocationSlugExistsArgs {
  userid: string
  slug: string | null
}

export interface CheckLocationSlugExistsRow {
  exists: boolean
}

export async function checkLocationSlugExists(
  client: Client,
  args: CheckLocationSlugExistsArgs,
): Promise<CheckLocationSlugExistsRow | null> {
  const result = await client.query({
    text: checkLocationSlugExistsQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    exists: row[0],
  }
}

export const listLocationsForUserQuery = `-- name: ListLocationsForUser :many
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM locations WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface ListLocationsForUserArgs {
  userid: string
  limit: string
  offset: string
}

export interface ListLocationsForUserRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listLocationsForUser(
  client: Client,
  args: ListLocationsForUserArgs,
): Promise<ListLocationsForUserRow[]> {
  const result = await client.query({
    text: listLocationsForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const listLocationsForUserWithPrivacyQuery = `-- name: ListLocationsForUserWithPrivacy :many
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM locations
WHERE "userId" = $1
  AND (privacy = 'public' OR $2::boolean = true)
ORDER BY created_at DESC`

export interface ListLocationsForUserWithPrivacyArgs {
  ownerId: string
  isOwner: boolean
}

export interface ListLocationsForUserWithPrivacyRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listLocationsForUserWithPrivacy(
  client: Client,
  args: ListLocationsForUserWithPrivacyArgs,
): Promise<ListLocationsForUserWithPrivacyRow[]> {
  const result = await client.query({
    text: listLocationsForUserWithPrivacyQuery,
    values: [args.ownerId, args.isOwner],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const updateLocationQuery = `-- name: UpdateLocation :one
UPDATE locations SET name = $2, description = $3, updated_at = NOW()
WHERE id = $1 RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface UpdateLocationArgs {
  id: number
  name: string
  description: string | null
}

export interface UpdateLocationRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateLocation(
  client: Client,
  args: UpdateLocationArgs,
): Promise<UpdateLocationRow | null> {
  const result = await client.query({
    text: updateLocationQuery,
    values: [args.id, args.name, args.description],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const updateLocationPrivacyQuery = `-- name: UpdateLocationPrivacy :one
UPDATE locations
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface UpdateLocationPrivacyArgs {
  id: number
  privacy: string
}

export interface UpdateLocationPrivacyRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateLocationPrivacy(
  client: Client,
  args: UpdateLocationPrivacyArgs,
): Promise<UpdateLocationPrivacyRow | null> {
  const result = await client.query({
    text: updateLocationPrivacyQuery,
    values: [args.id, args.privacy],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const deleteLocationQuery = `-- name: DeleteLocation :exec
DELETE FROM locations WHERE id = $1`

export interface DeleteLocationArgs {
  id: number
}

export async function deleteLocation(
  client: Client,
  args: DeleteLocationArgs,
): Promise<void> {
  await client.query({
    text: deleteLocationQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const createTimelineQuery = `-- name: CreateTimeline :one
INSERT INTO timelines ("userId", name, description, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface CreateTimelineArgs {
  userid: string
  name: string
  description: string | null
  privacy: string
  slug: string | null
}

export interface CreateTimelineRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function createTimeline(
  client: Client,
  args: CreateTimelineArgs,
): Promise<CreateTimelineRow | null> {
  const result = await client.query({
    text: createTimelineQuery,
    values: [args.userid, args.name, args.description, args.privacy, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getTimelineQuery = `-- name: GetTimeline :one
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM timelines WHERE id = $1 LIMIT 1`

export interface GetTimelineArgs {
  id: number
}

export interface GetTimelineRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getTimeline(
  client: Client,
  args: GetTimelineArgs,
): Promise<GetTimelineRow | null> {
  const result = await client.query({
    text: getTimelineQuery,
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
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const getTimelineBySlugQuery = `-- name: GetTimelineBySlug :one
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM timelines WHERE "userId" = $1 AND slug = $2 LIMIT 1`

export interface GetTimelineBySlugArgs {
  userid: string
  slug: string | null
}

export interface GetTimelineBySlugRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getTimelineBySlug(
  client: Client,
  args: GetTimelineBySlugArgs,
): Promise<GetTimelineBySlugRow | null> {
  const result = await client.query({
    text: getTimelineBySlugQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const checkTimelineSlugExistsQuery = `-- name: CheckTimelineSlugExists :one
SELECT EXISTS(SELECT 1 FROM timelines WHERE "userId" = $1 AND slug = $2) AS exists`

export interface CheckTimelineSlugExistsArgs {
  userid: string
  slug: string | null
}

export interface CheckTimelineSlugExistsRow {
  exists: boolean
}

export async function checkTimelineSlugExists(
  client: Client,
  args: CheckTimelineSlugExistsArgs,
): Promise<CheckTimelineSlugExistsRow | null> {
  const result = await client.query({
    text: checkTimelineSlugExistsQuery,
    values: [args.userid, args.slug],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    exists: row[0],
  }
}

export const listTimelinesForUserQuery = `-- name: ListTimelinesForUser :many
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM timelines WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3`

export interface ListTimelinesForUserArgs {
  userid: string
  limit: string
  offset: string
}

export interface ListTimelinesForUserRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listTimelinesForUser(
  client: Client,
  args: ListTimelinesForUserArgs,
): Promise<ListTimelinesForUserRow[]> {
  const result = await client.query({
    text: listTimelinesForUserQuery,
    values: [args.userid, args.limit, args.offset],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const listTimelinesForUserWithPrivacyQuery = `-- name: ListTimelinesForUserWithPrivacy :many
SELECT id, "userId", name, description, slug, privacy, created_at, updated_at FROM timelines
WHERE "userId" = $1
  AND (privacy = 'public' OR $2::boolean = true)
ORDER BY created_at DESC`

export interface ListTimelinesForUserWithPrivacyArgs {
  ownerId: string
  isOwner: boolean
}

export interface ListTimelinesForUserWithPrivacyRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listTimelinesForUserWithPrivacy(
  client: Client,
  args: ListTimelinesForUserWithPrivacyArgs,
): Promise<ListTimelinesForUserWithPrivacyRow[]> {
  const result = await client.query({
    text: listTimelinesForUserWithPrivacyQuery,
    values: [args.ownerId, args.isOwner],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
    }
  })
}

export const updateTimelineQuery = `-- name: UpdateTimeline :one
UPDATE timelines SET name = $2, description = $3, updated_at = NOW()
WHERE id = $1 RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface UpdateTimelineArgs {
  id: number
  name: string
  description: string | null
}

export interface UpdateTimelineRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateTimeline(
  client: Client,
  args: UpdateTimelineArgs,
): Promise<UpdateTimelineRow | null> {
  const result = await client.query({
    text: updateTimelineQuery,
    values: [args.id, args.name, args.description],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const updateTimelinePrivacyQuery = `-- name: UpdateTimelinePrivacy :one
UPDATE timelines
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, "userId", name, description, slug, privacy, created_at, updated_at`

export interface UpdateTimelinePrivacyArgs {
  id: number
  privacy: string
}

export interface UpdateTimelinePrivacyRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateTimelinePrivacy(
  client: Client,
  args: UpdateTimelinePrivacyArgs,
): Promise<UpdateTimelinePrivacyRow | null> {
  const result = await client.query({
    text: updateTimelinePrivacyQuery,
    values: [args.id, args.privacy],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userid: row[1],
    name: row[2],
    description: row[3],
    slug: row[4],
    privacy: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const deleteTimelineQuery = `-- name: DeleteTimeline :exec
DELETE FROM timelines WHERE id = $1`

export interface DeleteTimelineArgs {
  id: number
}

export async function deleteTimeline(
  client: Client,
  args: DeleteTimelineArgs,
): Promise<void> {
  await client.query({
    text: deleteTimelineQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const getUserByUsernameQuery = `-- name: GetUserByUsername :one
SELECT id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled", username FROM users WHERE username = $1 LIMIT 1`

export interface GetUserByUsernameArgs {
  username: string
}

export interface GetUserByUsernameRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  slug: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
  username: string | null
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
    slug: row[5],
    createdat: row[6],
    updatedat: row[7],
    role: row[8],
    locale: row[9],
    istwofactorenabled: row[10],
    username: row[11],
  }
}

export const checkUsernameExistsQuery = `-- name: CheckUsernameExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS exists`

export interface CheckUsernameExistsArgs {
  username: string
}

export async function checkUsernameExists(
  client: Client,
  args: CheckUsernameExistsArgs,
): Promise<boolean> {
  const result = await client.query({
    text: checkUsernameExistsQuery,
    values: [args.username],
    rowMode: 'array',
  })
  return result.rows[0]?.[0] ?? false
}

export const listPublicStoriesQuery = `-- name: ListPublicStories :many
SELECT
  s.id,
  s."userId",
  s.title,
  s.content,
  s.slug,
  s.created_at,
  s.updated_at,
  i.cloudinary_url as primary_image_url,
  u.username
FROM stories s
LEFT JOIN entity_images i ON i.entity_id = s.id
  AND i.entity_type = 'story'
  AND i.is_primary = true
LEFT JOIN users u ON u.id = s."userId"
WHERE s.privacy = 'public'
  AND ($3 = '' OR s.title ILIKE '%' || $3 || '%' OR s.content ILIKE '%' || $3 || '%')
ORDER BY s.created_at DESC
LIMIT $1 OFFSET $2`

export interface ListPublicStoriesArgs {
  limit: number
  offset: number
  query: string
}

export interface ListPublicStoriesRow {
  id: number
  userid: string
  title: string
  content: string | null
  slug: string | null
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
  username: string | null
}

export async function listPublicStories(
  client: Client,
  args: ListPublicStoriesArgs,
): Promise<ListPublicStoriesRow[]> {
  const result = await client.query({
    text: listPublicStoriesQuery,
    values: [args.limit, args.offset, args.query],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      title: row[2],
      content: row[3],
      slug: row[4],
      createdAt: row[5],
      updatedAt: row[6],
      primaryImageUrl: row[7],
      username: row[8],
    }
  })
}
