/**
 * @file This file contains server-side functions for fetching a single session's data.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { eq } from 'drizzle-orm';
import { sessions } from '@/db/schema/sessions';
import { users } from '@/db/schema/users';

/**
 * Preloads the data for a specific session into the cache.
 *
 * @param sessionId - The ID of the session to preload.
 */
export const preload = (sessionId: string) => {
  void getSession(sessionId);
};

/**
 * Fetches data for a single session from the database, including its associated generation and author information.
 * This function first retrieves the session data and then makes a separate query to fetch the author's details.
 * The result is cached using `unstable_cache` and tagged with 'sessions' for revalidation.
 *
 * @param sessionId - The ID of the session to fetch.
 * @returns A promise that resolves to the session object with its generation and author, or null if the session is not found.
 */
export const getSession = unstable_cache(
  async (sessionId: string) => {
    console.log(new Date(), 'Fetch Session Data', sessionId);

    // Fetch the main session data, including the generation it belongs to.
    const sessionData = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        generation: true,
      },
    });

    // If the session doesn't exist, return null.
    if (!sessionData) {
      return null;
    }

    // If the session has an author, fetch the author's data.
    const authorData = sessionData.authorId
      ? await db.query.users.findFirst({
          where: eq(users.id, sessionData.authorId),
        })
      : null;

    // Combine the session data with the author data.
    return { ...sessionData, author: authorData };
  },
  ['getSession'], // Unique key for this cache entry
  {
    tags: ['sessions'], // Cache tag for revalidation
  },
);