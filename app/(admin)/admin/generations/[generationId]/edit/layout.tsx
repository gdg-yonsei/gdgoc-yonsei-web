/** `generations` 수정 권한이 없으면 403이다. */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('put', 'generations')
