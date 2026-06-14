import 'server-only'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'

export async function getGenerationRouteParams() {
  const rows = await db.select({ id: generations.id }).from(generations)
  return rows.map(({ id }) => ({ generationId: String(id) }))
}

export async function getPartRouteParams() {
  const rows = await db.select({ id: parts.id }).from(parts)
  return rows.map(({ id }) => ({ partId: String(id) }))
}

export async function getProjectRouteParams() {
  const rows = await db.select({ id: projects.id }).from(projects)
  return rows.map(({ id }) => ({ projectId: id }))
}

export async function getSessionRouteParams() {
  const rows = await db.select({ id: sessions.id }).from(sessions)
  return rows.map(({ id }) => ({ sessionId: id }))
}

export async function getMemberRouteParams() {
  const rows = await db.select({ id: users.id }).from(users)
  return rows.map(({ id }) => ({ memberId: id }))
}
