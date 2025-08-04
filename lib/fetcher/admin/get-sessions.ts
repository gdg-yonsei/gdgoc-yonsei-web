/**
 * @file This file contains a server-side function for fetching all sessions, grouped by generation.
 * It uses Next.js's unstable_cache for caching.
 */

import { sessions } from '@/db/schema/sessions';
import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { desc } from 'drizzle-orm';
import { generations } from '@/db/schema/generations';

/**
 * Preloads all sessions data, grouped by generation, into the cache.
 * This can be used to warm up the cache for pages displaying session information.
 */
export const preload = () => {
  void getSessions();
};

/**
 * Fetches all generations and their associated sessions from the database.
 * The sessions within each generation are ordered by their event date in descending order.
 * The generations themselves are ordered by their ID in descending order.
 * The result is cached and tagged with both 'sessions' and 'generations' for revalidation.
 *
 * @returns A promise that resolves to an array of generation objects, each containing its sessions.
 */
export const getSessions = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Sessions Data');
    return db.query.generations.findMany({
      with: {
        sessions: {
          orderBy: desc(sessions.eventDate),
        },
      },
      orderBy: desc(generations.id),
    });
  },
  ['getSessions'], // Unique key for this cache entry
  {
    tags: ['sessions', 'generations'], // Cache tags for revalidation
  },
);