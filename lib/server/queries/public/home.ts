import 'server-only'

import db from '@/db'
import { externalParticipants } from '@/db/schema/external-participants'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import type { Locale } from '@/i18n-config'
import { HEATMAP_WEEKS, WEEK_MS, type ActivityCategory } from '@/lib/heatmap'
import {
  cacheQuery,
  generationLatestTag,
  generationListTag,
  memberListTag,
  projectListTag,
  sessionListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'

/** 최근 52주 히트맵용 공개 세션 + 참여 인원 카운트 */
export async function getHeatmapSessions(
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [sessionListTag(locale)])

  const bucketDate = new Date(visibilityBucket)
  const windowStart = new Date(bucketDate.getTime() - HEATMAP_WEEKS * WEEK_MS)

  return db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      startAt: sessions.startAt,
      category: sessions.category,
      internalCount:
        sql<number>`(select count(*) from "userToSession" uts where uts."sessionId" = ${sessions.id})`.mapWith(
          Number
        ),
      externalCount:
        sql<number>`(select count(*) from "external_participants" ep where ep."sessionId" = ${sessions.id})`.mapWith(
          Number
        ),
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.displayOnWebsite, true),
        gte(sessions.startAt, windowStart),
        lte(sessions.startAt, bucketDate)
      )
    )
    .orderBy(asc(sessions.startAt))
}

/** 최신 기수의 프로젝트 최대 9개 (태그 포함) */
export async function getFeaturedProjects(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.projectList, [
    projectListTag(locale),
    generationLatestTag(locale),
  ])

  const latestGeneration = await db.query.generations.findFirst({
    orderBy: desc(generations.startDate),
    columns: { id: true, name: true },
    with: {
      projects: {
        columns: {
          id: true,
          name: true,
          nameKo: true,
          description: true,
          descriptionKo: true,
          mainImage: true,
          repoUrl: true,
          demoUrl: true,
        },
        orderBy: desc(projects.updatedAt),
        limit: 9,
        with: {
          projectsToTags: {
            with: { tag: { columns: { name: true } } },
          },
        },
      },
    },
  })

  if (!latestGeneration) {
    return []
  }

  return latestGeneration.projects.map((project) => ({
    id: project.id,
    name: project.name,
    nameKo: project.nameKo,
    description: project.description,
    descriptionKo: project.descriptionKo,
    mainImage: project.mainImage,
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    generationName: latestGeneration.name,
    tags: project.projectsToTags.map((projectToTag) => projectToTag.tag.name),
  }))
}

/** 커뮤니티 집계 (하드코딩 금지 — 스펙 §9 Stats) */
export async function getCommunityStats(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [
    sessionListTag(locale),
    projectListTag(locale),
    memberListTag(locale),
  ])

  const countValue = sql<number>`count(*)`.mapWith(Number)

  const [
    sessionRows,
    internalRows,
    externalRows,
    projectRows,
    latestGeneration,
  ] = await Promise.all([
    db
      .select({ value: countValue })
      .from(sessions)
      .where(eq(sessions.displayOnWebsite, true)),
    db.select({ value: countValue }).from(userToSession),
    db.select({ value: countValue }).from(externalParticipants),
    db.select({ value: countValue }).from(projects),
    db.query.generations.findFirst({
      orderBy: desc(generations.startDate),
      columns: { id: true },
    }),
  ])

  const partRows = latestGeneration
    ? await db
        .select({ value: countValue })
        .from(parts)
        .where(eq(parts.generationsId, latestGeneration.id))
    : [{ value: 0 }]

  return {
    sessionCount: sessionRows[0]?.value ?? 0,
    participantTotal:
      (internalRows[0]?.value ?? 0) + (externalRows[0]?.value ?? 0),
    projectCount: projectRows[0]?.value ?? 0,
    partCount: partRows[0]?.value ?? 0,
  }
}

export type TimelineSessionDTO = {
  id: string
  name: string
  nameKo: string
  startAt: Date
  category: ActivityCategory
}

/** 기수별 연혁 타임라인 (공개 세션 압축 컬럼 포함) */
export async function getGenerationTimeline(
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [
    sessionListTag(locale),
    generationListTag(locale),
  ])

  const bucketDate = new Date(visibilityBucket)

  const rows = await db
    .select({
      generationId: generations.id,
      generationName: generations.name,
      startDate: generations.startDate,
      endDate: generations.endDate,
      sessionId: sessions.id,
      sessionName: sessions.name,
      sessionNameKo: sessions.nameKo,
      sessionStartAt: sessions.startAt,
      sessionCategory: sessions.category,
    })
    .from(generations)
    .leftJoin(parts, eq(parts.generationsId, generations.id))
    .leftJoin(
      sessions,
      and(
        eq(sessions.partId, parts.id),
        eq(sessions.displayOnWebsite, true),
        lte(sessions.startAt, bucketDate)
      )
    )
    .orderBy(asc(generations.startDate), asc(sessions.startAt))

  const timeline = new Map<
    number,
    {
      id: number
      name: string
      startDate: string
      endDate: string | null
      sessions: TimelineSessionDTO[]
    }
  >()

  for (const row of rows) {
    let entry = timeline.get(row.generationId)
    if (!entry) {
      entry = {
        id: row.generationId,
        name: row.generationName,
        startDate: row.startDate,
        endDate: row.endDate,
        sessions: [],
      }
      timeline.set(row.generationId, entry)
    }
    if (
      row.sessionId !== null &&
      row.sessionStartAt !== null &&
      row.sessionCategory !== null
    ) {
      entry.sessions.push({
        id: row.sessionId,
        name: row.sessionName ?? '',
        nameKo: row.sessionNameKo ?? '',
        startAt: row.sessionStartAt,
        category: row.sessionCategory,
      })
    }
  }

  return [...timeline.values()]
}

export type HeatmapSessionRow = Awaited<
  ReturnType<typeof getHeatmapSessions>
>[number]
export type FeaturedProject = Awaited<
  ReturnType<typeof getFeaturedProjects>
>[number]
export type CommunityStats = Awaited<ReturnType<typeof getCommunityStats>>
export type GenerationTimelineEntry = Awaited<
  ReturnType<typeof getGenerationTimeline>
>[number]
