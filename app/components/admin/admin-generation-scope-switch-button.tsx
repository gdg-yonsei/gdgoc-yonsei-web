'use client'

/**
 * 항목의 기수로 범위를 바로 전환하는 버튼(클라이언트 컴포넌트). 기수 불일치 경고 안에서 쓴다.
 */
import { type ReactNode } from 'react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAdminGenerationScopeAction } from '@/app/components/admin/admin-generation-scope-actions'

/**
 * 누르면 범위 쿠키를 `scopeValue`로 바꾸고 화면을 새로 고친다.
 *
 * @param scopeValue 전환할 범위 값(기수 id 문자열)
 * @param children 버튼 문구
 */
export default function AdminGenerationScopeSwitchButton({
  scopeValue,
  children,
}: {
  scopeValue: string
  children: ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type={'button'}
      className={'admin-btn-primary min-h-9'}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setAdminGenerationScopeAction(scopeValue)
          router.refresh()
        })
      }}
    >
      {children}
    </button>
  )
}
