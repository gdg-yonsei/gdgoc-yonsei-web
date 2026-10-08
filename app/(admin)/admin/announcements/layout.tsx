/** 공지 관리 영역의 권한 경계. `announcementsPage` 리소스에 `get` 권한이 없으면 403(`forbidden()`). */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('get', 'announcementsPage')
