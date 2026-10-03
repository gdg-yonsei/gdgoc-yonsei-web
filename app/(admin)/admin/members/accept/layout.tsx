/**
 * 가입 승인 화면의 권한 경계. `membersRole` 리소스에 `put` 권한이 없으면 403(`forbidden()`).
 */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('put', 'membersRole')
