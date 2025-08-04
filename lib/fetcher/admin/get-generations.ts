/**
 * @file This file contains server-side functions for fetching all generations' data.
 * It uses Next.js's unstable_cache for caching and performance optimization.
 */

import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { generations } from '@/db/schema/generations';
import { desc } from 'drizzle-orm';

/**
 * Preloads all generations data into the cache.
 * This can be used to warm up the cache for the generations list page.
 */
export const preload = () => {
  void getGenerations();
};

/**
 * Fetches all generations from the database, ordered by ID in descending order.
 * The result is cached and tagged with 'generations' for revalidation purposes.
 *
 * @returns A promise that resolves to an array of all generation objects.
 */
export const getGenerations = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Generations Data');
    return db.select().from(generations).orderBy(desc(generations.id));
  },
  ['getGenerations'], // Unique key for this cache entry
  {
    tags: ['generations'], // Cache tag for revalidation
  },
);