/**
 * @file This file contains server-side functions for fetching a single generation's data.
 * It utilizes Next.js's unstable_cache for efficient data fetching and caching.
 */

import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { eq } from 'drizzle-orm'
import { dbCache } from '@/lib/server/fetcher/db-cache'

/**
 * Preloads the data for a specific generation into the cache.
 * This function is useful for warming up the cache for frequently accessed generations,
 * potentially improving user experience by reducing load times.
 *
 * @param generationId - The ID of the generation to preload.
 */
export const preloadGeneration = (generationId: number) => {
  // The function is called without `await` to not block the execution flow.
  // The caching is handled by `getGeneration` internally.
  void getGeneration(generationId)
}

/**
 * Fetches data for a single generation from the database, including its associated parts and members.
 * This function is wrapped with `unstable_cache` to cache the results and reduce database queries.
 * The cache is tagged with 'generations', allowing for on-demand revalidation.
 *
 * @param generationId - The ID of the generation to fetch.
 * @returns A promise that resolves to the generation object with its relations, or undefined if not found.
 */
export const getGeneration = dbCache(
  async (generationId: number) => {
    console.log(new Date(), 'Fetch Generation Data', generationId)
    return db.query.generations.findFirst({
      where: eq(generations.id, generationId),
      with: {
        parts: {
          with: {
            usersToParts: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    })
  },
  [],
  {
    tags: ['generations'], // Cache tag for revalidation
  }
)
