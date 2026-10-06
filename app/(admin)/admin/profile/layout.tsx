/** 내 프로필 영역(보기·수정)의 권한 경계. `profilePage` 리소스에 `get` 권한이 없으면 403(`forbidden()`). */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('get', 'profilePage')
