import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import db from '@/db'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

export type AdminPartListItem = {
  id: number
  name: string
  description: string | null
  displayOrder: number
  memberCount: number
  generationId: number | null
  generationName: string | null
}

export const preloadParts = (scope?: AdminGenerationScope | null) => {
  void getParts(scope)
}

export async function getParts(scope?: AdminGenerationScope | null) {
  noStore()

  const partList = await db.query.parts.findMany({
    where:
      scope?.kind === 'generation'
        ? (part, { eq }) => eq(part.generationsId, scope.generationId)
        : undefined,
    with: {
      generation: true,
      usersToParts: true,
    },
    orderBy: (part, { asc, desc }) => [
      desc(part.generationsId),
      asc(part.displayOrder),
      asc(part.createdAt),
    ],
  })

  return partList.map<AdminPartListItem>((part) => ({
    id: part.id,
    name: part.name,
    description: part.description,
    displayOrder: part.displayOrder,
    memberCount: part.usersToParts.length,
    generationId: part.generation?.id ?? part.generationsId ?? null,
    generationName: part.generation?.name ?? null,
  }))
}
