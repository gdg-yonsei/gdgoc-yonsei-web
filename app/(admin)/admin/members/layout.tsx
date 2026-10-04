/**
 * 멤버 관리 영역(목록·상세·수정 전체)의 권한 경계. `membersPage` 리소스에 `get` 권한이 없으면 403(`forbidden()`).
 */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('get', 'membersPage')
