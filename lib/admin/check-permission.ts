type Role = 'MEMBER' | 'CORE' | 'LEAD' | 'ALUMNUS' | 'UNVERIFIED'

interface Permission {
  [action: string]: {
    [resource: string]: boolean
  }
}

/**
 * 데이터 권한 확인 함수
 * @param userId - 사용자 ID
 * @param dataOwnerId - 데이터 소유자 ID
 */
export default function checkPermission(
  userId: string,
  dataOwnerId?: string
): {
  [role in Role]: Permission
} {
  return {
    MEMBER: {
      get: {
        adminPage: true,
        membersPage: false,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: false,
        partsPage: false,
      },
      post: {
        members: userId === dataOwnerId,
        membersRole: false,
        generations: false,
        projects: true,
        sessions: false,
        parts: false,
      },
      put: {
        members: userId === dataOwnerId,
        membersRole: false,
        generations: false,
        projects: userId === dataOwnerId,
        sessions: false,
        parts: false,
      },
      delete: {
        members: userId === dataOwnerId,
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
    },
    CORE: {
      get: {
        adminPage: true,
        membersPage: true,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: false,
        partsPage: true,
      },
      post: {
        members: true,
        membersRole: false,
        generations: false,
        projects: true,
        sessions: true,
      },
      put: {
        members: true,
        membersRole: false,
        generations: false,
        projects: true,
        sessions: true,
      },
      delete: {
        members: userId === dataOwnerId,
        membersRole: false,
        generations: false,
        projects: true,
        sessions: true,
      },
    },
    LEAD: {
      get: {
        adminPage: true,
        membersPage: true,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: true,
        partsPage: true,
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
    ALUMNUS: {
      get: {
        adminPage: true,
        membersPage: false,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
        generationsPage: false,
        partsPage: false,
      },
      post: {
        members: userId === dataOwnerId,
        membersRole: false,
        generations: false,
        projects: false,
        sessions: false,
        parts: false,
      },
      put: {
        members: userId === dataOwnerId,
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
  }
}
