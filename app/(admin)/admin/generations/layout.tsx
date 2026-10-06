/** 기수 관리 영역은 `generationsPage` 읽기 권한이 없으면 403이다. */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('get', 'generationsPage')
