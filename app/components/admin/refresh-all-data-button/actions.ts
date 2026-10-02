'use server'

/**
 * 공개 사이트 캐시 전체 무효화 Server Action. 권한은 CORE·LEAD(`publicCache` 리소스의 `put`).
 */
import { invalidateAllPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { requirePermission } from '@/lib/server/permission/require-permission'

/**
 * 공개 사이트의 목록 캐시를 즉시 무효화한다(사이드바의 새로고침 버튼): 홈, 허브(세션·프로젝트·멤버·캘린더), 기수 목록, 사이트맵.
 * DB를 직접 고친 뒤 화면에 반영되지 않을 때 쓰는 비상용 기능이다.
 *
 * 세션·프로젝트 **상세 페이지** 캐시(`*:item:*` 태그)는 지우지 않는다. 상세는 관리자 화면에서 그 항목을
 * 수정하면 무효화되고, 그렇지 않으면 수명(`policy.ts`)이 끝날 때까지 남는다.
 */
export async function revalidateAllDataAction() {
  await requirePermission('put', 'publicCache')

  logger.info('admin.refresh-all', 'Refreshing public cache surfaces')
  invalidateAllPublicCache()
}
