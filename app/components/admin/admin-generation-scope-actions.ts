'use server'

/**
 * 관리자 기수 범위(generation scope) 쿠키를 바꾸는 Server Action.
 *
 * 기수 선택 드롭다운과 "이 항목의 기수로 전환" 버튼이 호출한다. 쿠키 값은 서버에서
 * 사용자 권한으로 다시 검증하므로 클라이언트가 접근 불가 기수를 넣을 수 없다.
 */
import { cookies } from 'next/headers'
import { getAuthSession } from '@/auth'
import {
  ADMIN_GENERATION_SCOPE_COOKIE,
  normalizeAdminGenerationScopeValueForUser,
} from '@/lib/server/admin-generation-scope'

/**
 * 선택한 기수 범위를 쿠키에 저장한다.
 *
 * @param nextValue 직렬화된 범위 값(기수 id 또는 "전체")
 * 부수효과: 쿠키 설정/삭제. 로그인하지 않았으면 아무 일도 하지 않고, 사용자가 접근할 수
 * 없는 값이면 쿠키를 지워 기본 범위로 돌아가게 한다. 호출한 쪽에서 `router.refresh()`로
 * 화면을 다시 그려야 한다.
 */
export async function setAdminGenerationScopeAction(nextValue: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return
  }

  const cookieStore = await cookies()
  const normalizedValue = await normalizeAdminGenerationScopeValueForUser(
    session.user.id,
    nextValue
  )

  if (!normalizedValue) {
    cookieStore.delete(ADMIN_GENERATION_SCOPE_COOKIE)
    return
  }

  cookieStore.set(ADMIN_GENERATION_SCOPE_COOKIE, normalizedValue, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
