import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { authSessions } from '@/db/schema/auth-sessions'
import { users } from '@/db/schema/users'

/**
 * GYMS MCP 인가 서버 테이블.
 *
 * `@better-auth/mcp`(oauth-provider), `jwt()`, `@better-auth/cimd` 1.7.6 이 요구하는
 * 모델을 `getAuthTables()` 출력에서 옮겼다. 필드 이름은 Better Auth 모델 필드와 같아야
 * 하고, pg 에서는 `string[]` 을 네이티브 배열, `json` 을 jsonb 로 저장한다.
 * 사용자 삭제 시 발급 토큰·동의 기록도 함께 지운다.
 */

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

export const jwks = pgTable('jwks', {
  id: id(),
  publicKey: text('publicKey').notNull(),
  privateKey: text('privateKey').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }),
  alg: text('alg'),
  crv: text('crv'),
})

export const oauthClient = pgTable(
  'oauth_client',
  {
    id: id(),
    clientId: text('clientId').notNull().unique(),
    clientSecret: text('clientSecret'),
    clientDiscoveryId: text('clientDiscoveryId'),
    disabled: boolean('disabled').default(false),
    skipConsent: boolean('skipConsent'),
    enableEndSession: boolean('enableEndSession'),
    subjectType: text('subjectType'),
    scopes: text('scopes').array(),
    clientCredentialsScopes: text('clientCredentialsScopes').array(),
    userId: text('userId').references(() => users.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('createdAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }),
    name: text('name'),
    uri: text('uri'),
    icon: text('icon'),
    contacts: text('contacts').array(),
    tos: text('tos'),
    policy: text('policy'),
    softwareId: text('softwareId'),
    softwareVersion: text('softwareVersion'),
    softwareStatement: text('softwareStatement'),
    redirectUris: text('redirectUris').array().notNull(),
    postLogoutRedirectUris: text('postLogoutRedirectUris').array(),
    backchannelLogoutUri: text('backchannelLogoutUri'),
    backchannelLogoutSessionRequired: boolean(
      'backchannelLogoutSessionRequired'
    ),
    tokenEndpointAuthMethod: text('tokenEndpointAuthMethod'),
    applicationType: text('applicationType'),
    jwks: text('jwks'),
    jwksUri: text('jwksUri'),
    grantTypes: text('grantTypes').array(),
    responseTypes: text('responseTypes').array(),
    requirePKCE: boolean('requirePKCE'),
    dpopBoundAccessTokens: boolean('dpopBoundAccessTokens').default(false),
    referenceId: text('referenceId'),
    metadata: jsonb('metadata'),
  },
  (table) => [index('oauth_client_userId_idx').on(table.userId)]
)

export const oauthResource = pgTable('oauth_resource', {
  id: id(),
  identifier: text('identifier').notNull().unique(),
  name: text('name').notNull(),
  accessTokenTtl: integer('accessTokenTtl'),
  refreshTokenTtl: integer('refreshTokenTtl'),
  signingAlgorithm: text('signingAlgorithm'),
  signingKeyId: text('signingKeyId'),
  allowedScopes: text('allowedScopes').array(),
  customClaims: jsonb('customClaims'),
  dpopBoundAccessTokensRequired: boolean(
    'dpopBoundAccessTokensRequired'
  ).default(false),
  disabled: boolean('disabled').default(false),
  createdAt: timestamp('createdAt', { mode: 'date' }),
  updatedAt: timestamp('updatedAt', { mode: 'date' }),
  policyVersion: integer('policyVersion'),
  metadata: jsonb('metadata'),
})

export const oauthClientResource = pgTable(
  'oauth_client_resource',
  {
    id: id(),
    clientId: text('clientId')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    resourceId: text('resourceId')
      .notNull()
      .references(() => oauthResource.identifier, { onDelete: 'cascade' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'date' }),
  },
  (table) => [
    index('oauth_client_resource_clientId_idx').on(table.clientId),
    index('oauth_client_resource_resourceId_idx').on(table.resourceId),
  ]
)

export const oauthRefreshToken = pgTable(
  'oauth_refresh_token',
  {
    id: id(),
    token: text('token').notNull().unique(),
    clientId: text('clientId')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text('sessionId').references(() => authSessions.id, {
      onDelete: 'set null',
    }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referenceId: text('referenceId'),
    authorizationCodeId: text('authorizationCodeId'),
    resources: text('resources').array(),
    requestedUserInfoClaims: text('requestedUserInfoClaims').array(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
    revoked: timestamp('revoked', { mode: 'date' }),
    rotatedAt: timestamp('rotatedAt', { mode: 'date' }),
    rotationReplayResponse: text('rotationReplayResponse'),
    rotationReplayExpiresAt: timestamp('rotationReplayExpiresAt', {
      mode: 'date',
    }),
    authTime: timestamp('authTime', { mode: 'date' }),
    confirmation: jsonb('confirmation'),
    scopes: text('scopes').array().notNull(),
  },
  (table) => [
    index('oauth_refresh_token_clientId_idx').on(table.clientId),
    index('oauth_refresh_token_sessionId_idx').on(table.sessionId),
    index('oauth_refresh_token_userId_idx').on(table.userId),
    index('oauth_refresh_token_authorizationCodeId_idx').on(
      table.authorizationCodeId
    ),
  ]
)

export const oauthAccessToken = pgTable(
  'oauth_access_token',
  {
    id: id(),
    token: text('token').notNull().unique(),
    clientId: text('clientId')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text('sessionId').references(() => authSessions.id, {
      onDelete: 'set null',
    }),
    userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
    referenceId: text('referenceId'),
    authorizationCodeId: text('authorizationCodeId'),
    resources: text('resources').array(),
    requestedUserInfoClaims: text('requestedUserInfoClaims').array(),
    refreshId: text('refreshId').references(() => oauthRefreshToken.id, {
      onDelete: 'cascade',
    }),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
    revoked: timestamp('revoked', { mode: 'date' }),
    confirmation: jsonb('confirmation'),
    scopes: text('scopes').array().notNull(),
  },
  (table) => [
    index('oauth_access_token_clientId_idx').on(table.clientId),
    index('oauth_access_token_sessionId_idx').on(table.sessionId),
    index('oauth_access_token_userId_idx').on(table.userId),
    index('oauth_access_token_authorizationCodeId_idx').on(
      table.authorizationCodeId
    ),
    index('oauth_access_token_refreshId_idx').on(table.refreshId),
  ]
)

export const oauthConsent = pgTable(
  'oauth_consent',
  {
    id: id(),
    clientId: text('clientId')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
    referenceId: text('referenceId'),
    resources: text('resources').array(),
    requestedUserInfoClaims: text('requestedUserInfoClaims').array(),
    scopes: text('scopes').array().notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('oauth_consent_clientId_idx').on(table.clientId),
    index('oauth_consent_userId_idx').on(table.userId),
  ]
)

export const oauthClientAssertion = pgTable('oauth_client_assertion', {
  id: id(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
})
