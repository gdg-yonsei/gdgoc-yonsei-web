/**
 * @file This file contains server-side functions for fetching a single member's detailed data.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { users } from '@/db/schema/users';
import { desc, eq } from 'drizzle-orm';
import { usersToParts } from '@/db/schema/users-to-parts';
import { parts } from '@/db/schema/parts';
import { generations } from '@/db/schema/generations';

/**
 * Preloads the data for a specific member into the cache.
 *
 * @param userId - The ID of the user to preload.
 */
export const preload = (userId: string) => {
  void getMember(userId);
};

/**
 * Fetches detailed information for a single member by their user ID.
 * It joins user data with their part and generation information to provide a comprehensive view.
 * The query is ordered to retrieve the user's most recent role if they have multiple.
 * The result is cached using `unstable_cache` and tagged with 'members' for revalidation.
 *
 * @param userId - The ID of the user to fetch.
 * @returns A promise that resolves to an object containing the member's detailed information, or undefined if not found.
 */
export const getMember = unstable_cache(
  async (userId: string) => {
    console.log(new Date(), 'Fetch Member Data:', userId);
    // The query joins users with their parts and generations, then selects the most recent record.
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        firstNameKo: users.firstNameKo,
        lastName: users.lastName,
        lastNameKo: users.lastNameKo,
        role: users.role,
        image: users.image,
        part: parts.name,
        email: users.email,
        githubId: users.githubId,
        instagramId: users.instagramId,
        linkedInId: users.linkedInId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        isForeigner: users.isForeigner,
        generation: generations.name,
        major: users.major,
        studentId: users.studentId,
        telephone: users.telephone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
      .leftJoin(parts, eq(parts.id, usersToParts.partId))
      .leftJoin(generations, eq(generations.id, parts.generationsId))
      .orderBy(desc(generations.id), desc(parts.id), desc(users.updatedAt))
      .limit(1);

    return result[0];
  },
  ['getMember'], // Unique key for this cache entry
  {
    tags: ['members'], // Cache tag for revalidation
  },
);