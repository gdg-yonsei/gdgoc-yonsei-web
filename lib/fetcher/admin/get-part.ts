/**
 * @file This file contains server-side functions for fetching a single part's data, including its members.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { desc, eq } from 'drizzle-orm';
import { parts } from '@/db/schema/parts';

/**
 * Preloads the data for a specific part into the cache.
 *
 * @param partId - The ID of the part to preload.
 */
export const preload = (partId: number) => {
  void getPart(partId);
};

/**
 * Fetches data for a single part from the database, including the list of users associated with it.
 * The result is cached using `unstable_cache` and tagged with 'parts' for revalidation.
 *
 * @param partId - The ID of the part to fetch.
 * @returns A promise that resolves to the part object with its members, or undefined if not found.
 */
export const getPart = unstable_cache(
  async (partId: number) => {
    console.log(new Date(), 'Fetch Part Data', partId);
    return db.query.parts.findFirst({
      where: eq(parts.id, partId),
      with: {
        usersToParts: {
          with: {
            user: true, // Include the full user object for each member
          },
        },
      },
      orderBy: desc(parts.createdAt),
    });
  },
  ['getPart'], // Unique key for this cache entry
  {
    tags: ['parts'], // Cache tag for revalidation
  },
);