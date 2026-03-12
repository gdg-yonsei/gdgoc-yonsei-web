import { sql } from 'drizzle-orm'
import db from '../../../db'
import { authSessions } from '../../../db/schema/auth-sessions'
import { generations } from '../../../db/schema/generations'
import { parts } from '../../../db/schema/parts'
import { projects } from '../../../db/schema/projects'
import { sessions } from '../../../db/schema/sessions'
import { userToSession } from '../../../db/schema/user-to-session'
import { users } from '../../../db/schema/users'
import { usersToParts } from '../../../db/schema/users-to-parts'
import { usersToProjects } from '../../../db/schema/users-to-projects'
import { SeededE2EData } from './constants'

const FIXTURE_IDS = {
  adminUserId: 'e2e-admin-user',
  memberUserId: 'e2e-member-user',
  pendingApproveUserId: 'e2e-pending-approve-user',
  pendingDeleteUserId: 'e2e-pending-delete-user',
  projectId: '00000000-0000-4000-8000-000000000001',
  secondProjectId: '00000000-0000-4000-8000-000000000003',
  sessionId: '00000000-0000-4000-8000-000000000002',
  secondSessionId: '00000000-0000-4000-8000-000000000004',
  sessionToken: 'e2e-admin-session-token',
  generationName: 'e2e-gen',
  secondGenerationName: 'e2e-gen-2',
}

/**
 * Wipes data from all mutable tables and inserts one deterministic dataset for E2E.
 */
export async function resetAndSeedE2EDatabase(): Promise<SeededE2EData> {
  await db.execute(
    sql.raw(`
      TRUNCATE TABLE
        "userToSession",
        "external_participants",
        "users_to_projects",
        "projects_to_tags",
        "users_to_parts",
        "sessions",
        "projects",
        "parts",
        "generations",
        "account",
        "authenticator",
        "session",
        "verificationToken",
        "user",
        "tags"
      RESTART IDENTITY CASCADE
    `)
  )

  const [generation] = await db
    .insert(generations)
    .values({
      name: FIXTURE_IDS.generationName,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    })
    .returning({ id: generations.id, name: generations.name })

  const [secondGeneration] = await db
    .insert(generations)
    .values({
      name: FIXTURE_IDS.secondGenerationName,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    })
    .returning({ id: generations.id, name: generations.name })

  const [part] = await db
    .insert(parts)
    .values({
      name: 'E2E Part',
      description: 'Part for deterministic Playwright tests',
      generationsId: generation.id,
      displayOrder: 1,
    })
    .returning({ id: parts.id })

  const [secondPart] = await db
    .insert(parts)
    .values({
      name: 'E2E Part 2',
      description: 'Second generation part for scope switching tests',
      generationsId: secondGeneration.id,
      displayOrder: 1,
    })
    .returning({ id: parts.id })

  await db.insert(users).values([
    {
      id: FIXTURE_IDS.adminUserId,
      name: 'e2e-admin',
      email: 'e2e-admin@example.com',
      role: 'LEAD',
      firstName: 'Admin',
      lastName: 'Tester',
      firstNameKo: '관리',
      lastNameKo: '테스터',
      major: 'Computer Science',
      studentId: 20251234,
      telephone: '01012345678',
      isForeigner: false,
    },
    {
      id: FIXTURE_IDS.memberUserId,
      name: 'e2e-member',
      email: 'e2e-member@example.com',
      role: 'MEMBER',
      firstName: 'Member',
      lastName: 'Tester',
      firstNameKo: '멤버',
      lastNameKo: '테스터',
      major: 'Computer Science',
      studentId: 20255678,
      telephone: '01098765432',
      isForeigner: false,
    },
    {
      id: FIXTURE_IDS.pendingApproveUserId,
      name: 'e2e-pending-approve',
      email: 'e2e-pending-approve@example.com',
      role: 'UNVERIFIED',
      firstName: 'Pending',
      lastName: 'Approve',
      firstNameKo: '승인대기',
      lastNameKo: '유저',
      major: 'Computer Science',
      studentId: 20256789,
      telephone: '01022223333',
      isForeigner: false,
    },
    {
      id: FIXTURE_IDS.pendingDeleteUserId,
      name: 'e2e-pending-delete',
      email: 'e2e-pending-delete@example.com',
      role: 'UNVERIFIED',
      firstName: 'Pending',
      lastName: 'Delete',
      firstNameKo: '삭제대기',
      lastNameKo: '유저',
      major: 'Computer Science',
      studentId: 20257890,
      telephone: '01044445555',
      isForeigner: false,
    },
  ])

  await db.insert(usersToParts).values([
    {
      userId: FIXTURE_IDS.adminUserId,
      partId: part.id,
      userType: 'Core',
    },
    {
      userId: FIXTURE_IDS.adminUserId,
      partId: secondPart.id,
      userType: 'Core',
    },
    {
      userId: FIXTURE_IDS.memberUserId,
      partId: part.id,
      userType: 'Primary',
    },
  ])

  await db.insert(projects).values({
    id: FIXTURE_IDS.projectId,
    name: 'E2E Project',
    nameKo: 'E2E 프로젝트',
    description: 'Project seeded for Playwright tests',
    descriptionKo: 'Playwright 테스트용 프로젝트',
    content: '# E2E Project Content',
    contentKo: '# E2E 프로젝트 내용',
    mainImage: '/project-default.png',
    images: [],
    authorId: FIXTURE_IDS.adminUserId,
    generationId: generation.id,
  })

  await db.insert(projects).values({
    id: FIXTURE_IDS.secondProjectId,
    name: 'E2E Project 2',
    nameKo: 'E2E 프로젝트 2',
    description: 'Project in second generation for scope tests',
    descriptionKo: '기수 스코프 테스트용 두 번째 기수 프로젝트',
    content: '# E2E Project 2 Content',
    contentKo: '# E2E 프로젝트 2 내용',
    mainImage: '/project-default.png',
    images: [],
    authorId: FIXTURE_IDS.adminUserId,
    generationId: secondGeneration.id,
  })

  await db.insert(usersToProjects).values([
    {
      userId: FIXTURE_IDS.adminUserId,
      projectId: FIXTURE_IDS.projectId,
    },
    {
      userId: FIXTURE_IDS.memberUserId,
      projectId: FIXTURE_IDS.projectId,
    },
    {
      userId: FIXTURE_IDS.adminUserId,
      projectId: FIXTURE_IDS.secondProjectId,
    },
  ])

  await db.insert(sessions).values({
    id: FIXTURE_IDS.sessionId,
    name: 'E2E Session',
    nameKo: 'E2E 세션',
    description: 'Session seeded for Playwright tests',
    descriptionKo: 'Playwright 테스트용 세션',
    mainImage: '/session-default.png',
    images: [],
    authorId: FIXTURE_IDS.adminUserId,
    partId: part.id,
    internalOpen: true,
    publicOpen: true,
    displayOnWebsite: true,
    location: 'Room 101',
    locationKo: '101호',
    startAt: new Date('2025-06-01T10:00:00.000Z'),
    endAt: new Date('2025-06-01T12:00:00.000Z'),
  })

  await db.insert(sessions).values({
    id: FIXTURE_IDS.secondSessionId,
    name: 'E2E Session 2',
    nameKo: 'E2E 세션 2',
    description: 'Session in second generation for scope tests',
    descriptionKo: '기수 스코프 테스트용 두 번째 기수 세션',
    mainImage: '/session-default.png',
    images: [],
    authorId: FIXTURE_IDS.adminUserId,
    partId: secondPart.id,
    internalOpen: true,
    publicOpen: true,
    displayOnWebsite: true,
    location: 'Room 202',
    locationKo: '202호',
    startAt: new Date('2026-06-01T10:00:00.000Z'),
    endAt: new Date('2026-06-01T12:00:00.000Z'),
  })

  await db.insert(userToSession).values({
    userId: FIXTURE_IDS.memberUserId,
    sessionId: FIXTURE_IDS.sessionId,
  })

  await db.insert(authSessions).values({
    sessionToken: FIXTURE_IDS.sessionToken,
    userId: FIXTURE_IDS.adminUserId,
    expires: new Date('2099-01-01T00:00:00.000Z'),
  })

  return {
    generationId: generation.id,
    generationName: generation.name,
    secondGenerationId: secondGeneration.id,
    secondGenerationName: secondGeneration.name,
    partId: part.id,
    secondPartId: secondPart.id,
    projectId: FIXTURE_IDS.projectId,
    secondProjectId: FIXTURE_IDS.secondProjectId,
    sessionId: FIXTURE_IDS.sessionId,
    secondSessionId: FIXTURE_IDS.secondSessionId,
    adminUserId: FIXTURE_IDS.adminUserId,
    memberUserId: FIXTURE_IDS.memberUserId,
    pendingApproveUserId: FIXTURE_IDS.pendingApproveUserId,
    pendingDeleteUserId: FIXTURE_IDS.pendingDeleteUserId,
  }
}

export function getSeededAdminSessionToken() {
  return FIXTURE_IDS.sessionToken
}
