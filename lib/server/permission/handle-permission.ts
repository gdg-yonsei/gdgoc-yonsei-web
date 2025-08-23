/**
 * @file This file contains a server-side function for handling user permissions.
 */

import 'server-only'
import getUserRole from '@/lib/server/fetcher/admin/get-user-role'
import checkPermission from '@/lib/server/permission/check-permission'

/**
 * Defines the types of actions a user can perform.
 */
export type ActionType = 'get' | 'post' | 'put' | 'delete'

/**
 * Defines the types of resources a user can interact with.
 */
export type ResourceType =
  | 'members'
  | 'membersRole'
  | 'projects'
  | 'sessions'
  | 'generations'
  | 'parts'
  | 'membersPage'
  | 'profilePage'
  | 'projectsPage'
  | 'sessionsPage'
  | 'adminPage'
  | 'generationsPage'
  | 'partsPage'

/**
 * Checks if a user has permission to perform a specific action on a resource.
 * This is a server-side utility that fetches the user's role and then uses the
 * `checkPermission` matrix to determine access rights.
 *
 * @param userId - The ID of the user. If null or undefined, permission is denied.
 * @param action - The action being attempted (e.g., 'get', 'post').
 * @param resource - The resource being accessed (e.g., 'projects', 'membersPage').
 * @param dataOwnerId - The ID of the owner of the data, for ownership-based checks.
 * @returns A promise that resolves to `true` if the user has permission, otherwise `false`.
 */
export default async function handlePermission(
  userId: string | undefined | null,
  action: ActionType,
  resource: ResourceType,
  dataOwnerId?: string
): Promise<boolean> {
  // If there is no user ID, deny permission immediately.
  if (!userId) {
    return false
  }

  // Fetch the user's role from the database.
  const userRole = await getUserRole(userId)

  // Determine permission based on the user's role, the action, and the resource.
  return checkPermission(userId, dataOwnerId)[userRole][action][resource]
}
