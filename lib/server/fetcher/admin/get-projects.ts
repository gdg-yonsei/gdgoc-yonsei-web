/**
 * @file This file contains a server-side function for fetching all projects.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only'
import db from '@/db'
import { desc } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import { dbCache } from '@/lib/server/fetcher/db-cache'

/**
 * Preloads all projects data into the cache.
 * This can be used to warm up the cache for the projects list page.
 */
export const preload = () => {
  void getProjects()
}

/**
 * Fetches all projects from the database, ordered by their last update time in descending order.
 * The result is cached using `unstable_cache` and tagged with 'projects' for revalidation.
 *
 * @returns A promise that resolves to an array of all project objects.
 */
export const getProjects = dbCache(
  async () => {
    console.log(new Date(), 'Fetch Projects Data')
    return db.query.projects.findMany({
      orderBy: desc(projects.updatedAt),
    })
  },
  [], // Unique key for this cache entry
  {
    tags: ['projects'], // Cache tag for revalidation
  }
)
