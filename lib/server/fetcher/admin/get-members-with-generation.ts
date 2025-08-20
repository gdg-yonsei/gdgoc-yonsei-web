/**
 * @file This file contains a server-side function to fetch all generations with their associated members.
 * It uses Next.js's unstable_cache for efficient data fetching.
 */

import db from '@/db'
import { dbCache } from '@/lib/server/fetcher/db-cache'

/**
 * Preloads the data for all generations and their members into the cache.
 * This can be used to warm up the cache for pages that display this information.
 */
export const preload = () => {
  void getMembersWithGeneration()
}

/**
 * Fetches all generations and, for each generation, includes its parts and the members within those parts.
 * This provides a comprehensive nested structure of generations, parts, and users.
 * The result is cached and tagged with both 'generations' and 'members' for revalidation purposes.
 *
 * @returns A promise that resolves to an array of generation objects, each containing nested parts and user information.
 */
export const getMembersWithGeneration = dbCache(
  async () =>
    db.query.generations.findMany({
      with: {
        parts: {
          with: {
            usersToParts: {
              with: {
                user: true, // Include the full user object for each member
              },
            },
          },
        },
      },
    }),
  [], // Unique key for this cache entry
  {
    tags: ['generations', 'users'], // Cache tags for revalidation
  }
)
