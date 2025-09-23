import db from '@/db'
import { and, desc, eq, lte } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { sessions } from '@/db/schema/sessions'
import cacheTag from '@/lib/server/cacheTag'
import { parts } from '@/db/schema/parts'

export default async function getSessionList(generationName: string) {
  'use cache'
  cacheTag('sessions', 'generations')

  return db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      description: sessions.description,
      descriptionKo: sessions.descriptionKo,
      mainImage: sessions.mainImage,
      images: sessions.images,
      internalOpen: sessions.internalOpen,
      publicOpen: sessions.publicOpen,
      maxCapacity: sessions.maxCapacity,
      location: sessions.location,
      locationKo: sessions.locationKo,
      type: sessions.type,
      displayOnWebsite: sessions.displayOnWebsite,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
    })
    .from(sessions)
    .leftJoin(parts, eq(sessions.partId, parts.id))
    .leftJoin(generations, eq(generations.id, parts.generationsId))
    .where(
      and(
        eq(generations.name, generationName),
        eq(sessions.displayOnWebsite, true),
        lte(sessions.endAt, new Date())
      )
    )
    .orderBy(desc(sessions.endAt))
}
