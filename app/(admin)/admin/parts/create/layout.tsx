/** 파트 생성 화면의 권한 경계. `parts` 리소스에 `post` 권한이 없으면 403(`forbidden()`). */
import { permissionLayout } from '@/lib/server/permission/permission-layout'

export default permissionLayout('post', 'parts')
