/**
 * Drizzle 데이터베이스 클라이언트(PostgreSQL, postgres-js 드라이버).
 *
 * 앱 전체가 이 `db` 하나를 공유한다. 스키마 모듈을 모두 합쳐 넘기므로
 * `db.query.<table>` 관계형 쿼리를 쓸 수 있다.
 *
 * 여기서 `dotenv/config`를 불러오지 않는다. 앱은 Next.js가 `.env`를 읽고, Next 밖에서
 * 도는 도구(drizzle-kit, `db:seed`)는 각자 읽는다. e2e 설정이 `.env`를 물려받으면 안
 * 된다: 테스트 초기화가 운영 DB에 닿은 적이 있기 때문이다.
 *
 * 서버 전용이지만 `server-only`를 쓰지 않는다. tsx로 실행하는 시드·e2e 스크립트도 이
 * 모듈을 import하기 때문이다(같은 이유로 `env-core`를 쓴다).
 */
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
import * as bookingRequestsSchema from './schema/booking-requests'
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

/** 앱 전체가 공유하는 Drizzle 클라이언트. */
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
    ...bookingRequestsSchema,
    ...oauthSchema,
    ...mcpAuditLogSchema,
    ...mcpImageUploadSchema,
  },
})

/** Drizzle 데이터베이스 클라이언트 타입. */
export type Database = typeof db

/** `db.transaction()` 콜백이 받는 트랜잭션 객체 타입. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

/** 트랜잭션 안팎 어디서든 쿼리를 실행할 수 있는 객체(`db` 또는 트랜잭션). */
export type DbExecutor = Database | Transaction
