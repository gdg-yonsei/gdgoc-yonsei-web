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
      },
      post: {
        members: false,
        membersRole: false,
        projects: true,
        sessions: false,
      },
      put: {
        members: false,
        membersRole: false,
        projects: userId === dataOwnerId,
        sessions: false,
      },
      delete: {
        members: false,
        membersRole: false,
        projects: userId === dataOwnerId,
        sessions: false,
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
      },
      post: {
        members: true,
        membersRole: false,
        projects: true,
        sessions: true,
      },
      put: {
        members: true,
        membersRole: false,
        projects: true,
        sessions: true,
      },
      delete: {
        members: false,
        membersRole: false,
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
      },
      post: {
        members: true,
        membersRole: true,
        projects: true,
        sessions: true,
      },
      put: {
        members: true,
        membersRole: true,
        projects: true,
        sessions: true,
      },
      delete: {
        members: true,
        membersRole: true,
        projects: true,
        sessions: true,
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
      },
      post: {
        members: false,
        membersRole: false,
        projects: false,
        sessions: false,
      },
      put: {
        members: false,
        membersRole: false,
        projects: false,
        sessions: false,
      },
      delete: {
        members: false,
        membersRole: false,
        projects: false,
        sessions: false,
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
      },
      post: {
        members: false,
        membersRole: false,
        projects: false,
        sessions: false,
      },
      put: {
        members: false,
        membersRole: false,
        projects: false,
        sessions: false,
      },
      delete: {
        members: false,
        membersRole: false,
        projects: false,
        sessions: false,
      },
    },
  }
}
