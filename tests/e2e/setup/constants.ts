import path from 'node:path'

export const AUTH_DIR = path.resolve(process.cwd(), 'tests/e2e/.auth')
export const ADMIN_STORAGE_STATE = path.join(
  AUTH_DIR,
  'admin-storage-state.json'
)
export const SEEDED_DATA_FILE = path.join(AUTH_DIR, 'seed-data.json')

export type SeededE2EData = {
  generationId: number
  generationName: string
  partId: number
  projectId: string
  sessionId: string
  adminUserId: string
  memberUserId: string
  pendingApproveUserId: string
  pendingDeleteUserId: string
}
