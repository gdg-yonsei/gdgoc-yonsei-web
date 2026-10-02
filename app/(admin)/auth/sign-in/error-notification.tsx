'use client'

/**
 * 로그인 화면의 오류 문구(클라이언트 컴포넌트). OAuth 실패 시 붙는 `?error=` 값을 보여 준다.
 */
import { useSearchParams } from 'next/navigation'

/** `error` 쿼리 값이 있으면 그대로 보여 준다(React가 텍스트로 이스케이프한다). */
export default function ErrorNotification() {
  const searchParams = useSearchParams()

  const search = searchParams.get('error')
  return (
    <p role={'alert'} className={'type-body-sm text-danger'}>
      {search}
    </p>
  )
}
