/**
 * @file This file contains a server-side function for fetching all parts, grouped by generation.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { asc, desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'

/**
 * Preloads the data for all parts into the cache.
 * This can be used to warm up the cache for pages displaying part information.
 */
export const preload = () => {
  void getParts()
}

/**
 * Fetches all generations and their associated parts, including the members in each part.
 * The result is a nested structure: an array of generations, each containing its parts,
 * which in turn contain their members.
 * The data is ordered by generation ID (descending) and then by part creation date (ascending).
 * The result is cached and tagged with 'parts' for revalidation.
 *
 * @returns A promise that resolves to an array of generation objects, each with nested parts and user data.
 */
export const getParts = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Parts Data')
    return db.query.generations.findMany({
      with: {
        parts: {
          with: {
            usersToParts: {
              with: {
                user: true, // Include full user object for each member
              },
            },
          },
        },
      },
      orderBy: [desc(generations.id), asc(parts.createdAt)],
    })
  },
  ['parts'], // Unique key for this cache entry
  {
    tags: ['parts'], // Cache tag for revalidation
  }
)
