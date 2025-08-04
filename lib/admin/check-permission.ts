/**
 * @file This file defines the permission structure for different user roles in the application.
 */

/**
 * Represents the possible user roles.
 * - MEMBER: Regular member.
 * - CORE: Core member with more privileges.
 * - LEAD: Lead member with full privileges.
 * - ALUMNUS: Graduated member.
 * - UNVERIFIED: User who has not yet been verified.
 */
type Role = 'MEMBER' | 'CORE' | 'LEAD' | 'ALUMNUS' | 'UNVERIFIED';

/**
 * Defines the structure for permissions, mapping actions to resources.
 */
interface Permission {
  [action: string]: {
    [resource: string]: boolean;
  };
}

/**
 * Checks the permissions for a given user based on their role.
 * This function returns a comprehensive permission object that outlines what actions
 * a user can perform on various resources depending on their role.
 *
 * @param userId - The ID of the user whose permissions are being checked.
 * @param dataOwnerId - The ID of the owner of the data being accessed. This is used for ownership-based permissions.
 * @returns An object where keys are roles and values are permission objects detailing allowed actions.
 */
export default function checkPermission(
  userId: string,
  dataOwnerId?: string,
): {
  [role in Role]: Permission;
} {
  return {
    // Permissions for regular members
    MEMBER: {
      get: {
        adminPage: true,
        membersPage: false,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: false,
        partsPage: false,
        performancePage: false,
      },
      post: {
        members: userId === dataOwnerId, // Can only edit their own profile
        membersRole: false,
        generations: false,
        projects: true,
        sessions: false,
        parts: false,
      },
      put: {
        members: userId === dataOwnerId, // Can only edit their own profile
        membersRole: false,
        generations: false,
        projects: userId === dataOwnerId, // Can only edit their own projects
        sessions: false,
        parts: false,
      },
      delete: {
        members: userId === dataOwnerId, // Can only delete their own account
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
    },
    // Permissions for core members
    CORE: {
      get: {
        adminPage: true,
        membersPage: true,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: false,
        partsPage: true,
        performancePage: true,
      },
      post: {
        members: true,
        membersRole: false,
        generations: false,
        projects: true,
        sessions: true,
        parts: true,
      },
      put: {
        members: true,
        membersRole: false,
        generations: false,
        projects: true,
        sessions: true,
        parts: true,
      },
      delete: {
        members: userId === dataOwnerId, // Can only delete their own account
        membersRole: false,
        generations: false,
        projects: true,
        sessions: true,
        parts: false,
      },
    },
    // Permissions for lead members (full access)
    LEAD: {
      get: {
        adminPage: true,
        membersPage: true,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: true,
        partsPage: true,
        performancePage: true,
      },
      post: {
        members: true,
        membersRole: true,
        generations: true,
        projects: true,
        sessions: true,
        parts: true,
      },
      put: {
        members: true,
        membersRole: true,
        generations: true,
        projects: true,
        sessions: true,
        parts: true,
      },
      delete: {
        members: true,
        membersRole: true,
        generations: true,
        projects: true,
        sessions: true,
        parts: true,
      },
    },
    // Permissions for alumni
    ALUMNUS: {
      get: {
        adminPage: true,
        membersPage: false,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: false,
        partsPage: false,
        performancePage: false,
      },
      post: {
        members: userId === dataOwnerId, // Can only edit their own profile
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
      put: {
        members: userId === dataOwnerId, // Can only edit their own profile
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
      delete: {
        members: false,
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
    },
    // Permissions for unverified users (no access)
    UNVERIFIED: {
      get: {
        adminPage: false,
        membersPage: false,
        profilePage: false,
        projectsPage: false,
        sessionsPage: false,
        generationsPage: false,
        partsPage: false,
      },
      post: {
        members: false,
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
      put: {
        members: false,
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
      delete: {
        members: false,
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
    },
  };
}