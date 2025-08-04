/**
 * @file This file contains server-side functions for fetching a single project's data.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db';
import { eq } from 'drizzle-orm';
import { projects } from '@/db/schema/projects';

/**
 * Preloads the data for a specific project into the cache.
 *
 * @param projectId - The ID of the project to preload.
 */
export const preload = (projectId: string) => {
  void getProject(projectId);
};

/**
 * Fetches data for a single project from the database, including its participants and associated generation.
 * The result is cached using `unstable_cache` and tagged with 'projects' for revalidation.
 *
 * @param projectId - The ID of the project to fetch.
 * @returns A promise that resolves to the project object with its relations, or undefined if not found.
 */
export const getProject = unstable_cache(
  async (projectId: string) => {
    console.log(new Date(), 'Fetch Project Data', projectId);
    // Although findMany is used, the query is filtered by a unique ID, so it will return at most one project.
    const result = await db.query.projects.findMany({
      where: eq(projects.id, projectId),
      with: {
        usersToProjects: {
          with: {
            user: true, // Include the full user object for each participant
          },
        },
        generation: true, // Include the generation object
      },
    });
    return result[0];
  },
  ['getProject'], // Unique key for this cache entry
  {
    tags: ['projects'], // Cache tag for revalidation
  },
);