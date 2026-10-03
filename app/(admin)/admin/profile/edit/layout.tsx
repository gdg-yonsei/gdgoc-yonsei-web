/**
 * 내 프로필 수정 화면의 권한 경계. 본인 데이터에 대한 `members` `put` 권한이 없으면 403(`forbidden()`).
 */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('put', 'members', { own: true })
