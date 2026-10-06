// dotenv는 호출자가 읽어야 e2e가 운영 DB 설정을 물려받지 않는다.
// tsx 시드·e2e에서도 가져오므로 server-only 대신 env-core를 쓴다.
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as accountsSchema from './schema/accounts'
import * as authSessionsSchema from './schema/auth-sessions'
import * as authenticatorsSchema from './schema/authenticators'
import * as generationsSchema from './schema/generations'
import * as partsSchema from './schema/parts'
import * as projectsSchema from './schema/projects'
import * as projectsToTagsSchema from './schema/projects-to-tags'
import * as sessionsSchema from './schema/sessions'
import * as tagsSchema from './schema/tags'
import * as usersSchema from './schema/users'
import * as usersToPartsSchema from './schema/users-to-parts'
import * as usersToProjectsSchema from './schema/users-to-projects'
import * as verificationTokensSchema from './schema/verification-tokens'
import * as externalParticipantsSchema from './schema/external-participants'
import * as userToSessionSchema from './schema/user-to-session'
import * as oauthSchema from './schema/oauth'
import * as mcpAuditLogSchema from './schema/mcp-audit-log'
import * as mcpImageUploadSchema from './schema/mcp-image-upload'
import { getDatabaseEnv } from '@/lib/server/env-core'

const databaseEnv = getDatabaseEnv()

// postgres-js는 기본적으로 쿼리 값에 `undefined`가 있으면 오류를 낸다. SQL NULL로 보내게 한다.
const client = postgres(databaseEnv.AUTH_DRIZZLE_URL, {
  transform: {
    undefined: null,
  },
})

export const db = drizzle(client, {
  schema: {
    ...accountsSchema,
    ...authSessionsSchema,
    ...authenticatorsSchema,
    ...generationsSchema,
    ...partsSchema,
    ...projectsSchema,
    ...projectsToTagsSchema,
    ...sessionsSchema,
    ...tagsSchema,
    ...usersSchema,
    ...usersToPartsSchema,
    ...usersToProjectsSchema,
    ...verificationTokensSchema,
    ...externalParticipantsSchema,
    ...userToSessionSchema,
    ...oauthSchema,
    ...mcpAuditLogSchema,
    ...mcpImageUploadSchema,
  },
})

export type Database = typeof db

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

export type DbExecutor = Database | Transaction
