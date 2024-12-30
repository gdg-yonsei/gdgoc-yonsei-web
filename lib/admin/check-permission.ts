type Role = 'member' | 'core' | 'lead' | 'alumnus' | 'unverified'

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
    member: {
      get: {
        adminPage: true,
        membersPage: false,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
      },
      post: {
        members: false,
        projects: true,
        sessions: false,
      },
      put: {
        members: false,
        projects: userId === dataOwnerId,
        sessions: false,
      },
      delete: {
        members: false,
        projects: userId === dataOwnerId,
        sessions: false,
      },
    },
    core: {
      get: {
        adminPage: true,
        membersPage: true,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
      },
      post: {
        members: true,
        projects: true,
        sessions: true,
      },
      put: {
        members: false,
        projects: true,
        sessions: true,
      },
      delete: {
        members: false,
        projects: true,
        sessions: true,
      },
    },
    lead: {
      get: {
        adminPage: true,
        membersPage: true,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
      },
      post: {
        members: true,
        projects: true,
        sessions: true,
      },
      put: {
        members: true,
        projects: true,
        sessions: true,
      },
      delete: {
        members: true,
        projects: true,
        sessions: true,
      },
    },
    alumnus: {
      get: {
        adminPage: true,
        membersPage: false,
        profilePage: true,
        projectsPage: true,
        sessionsPage: true,
      },
      post: {
        members: false,
        projects: false,
        sessions: false,
      },
      put: {
        members: false,
        projects: false,
        sessions: false,
      },
      delete: {
        members: false,
        projects: false,
        sessions: false,
      },
    },
    unverified: {
      get: {
        adminPage: false,
        membersPage: false,
        profilePage: false,
        projectsPage: false,
        sessionsPage: false,
      },
      post: {
        members: false,
        projects: false,
        sessions: false,
      },
      put: {
        members: false,
        projects: false,
        sessions: false,
      },
      delete: {
        members: false,
        projects: false,
        sessions: false,
      },
    },
  }
}
