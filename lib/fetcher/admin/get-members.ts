/**
 * @file This file contains server-side functions for fetching a list of all verified members.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { users } from '@/db/schema/users';
import { desc, eq, ne } from 'drizzle-orm';
import { usersToParts } from '@/db/schema/users-to-parts';
import { parts } from '@/db/schema/parts';
import { generations } from '@/db/schema/generations';

/**
 * Preloads the list of all members into the cache.
 */
export const preload = () => {
  void getMembers();
};

/**
 * Fetches a list of all members who are not 'UNVERIFIED'.
 * It joins user data with their most recent part and generation information.
 * Since a user can belong to multiple parts/generations over time, this function ensures
 * that each user appears only once in the final list, based on their latest record.
 * The result is cached and tagged with 'members' for revalidation.
 *
 * @returns A promise that resolves to an array of unique member objects.
 */
export const getMembers = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Members Data');

    // Fetch all users (except unverified) with their associated part and generation.
    const userList = await db
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
        generation: generations.name,
        isForeigner: users.isForeigner,
      })
      .from(users)
      .where(ne(users.role, 'UNVERIFIED'))
      .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
      .leftJoin(parts, eq(parts.id, usersToParts.partId))
      .leftJoin(generations, eq(generations.id, parts.generationsId))
      .orderBy(desc(generations.id), desc(parts.id), desc(users.updatedAt));

    // The query might return multiple rows for the same user if they have multiple roles.
    // We filter the list to ensure each user is included only once (their most recent role).
    const uniqueUsersId: string[] = [];
    const uniqueUsers = [];

    for (const user of userList) {
      if (!uniqueUsersId.includes(user.id)) {
        uniqueUsers.push(user);
        uniqueUsersId.push(user.id);
      }
    }

    return uniqueUsers;
  },
  ['getMembers'], // Unique key for this cache entry
  {
    tags: ['members'], // Cache tag for revalidation
  },
);