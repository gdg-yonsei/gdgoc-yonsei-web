import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'

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
import { getDatabaseEnv } from '@/lib/server/env-core'

const databaseEnv = getDatabaseEnv()

const db = drizzle(databaseEnv.AUTH_DRIZZLE_URL, {
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
  },
})

export default db
