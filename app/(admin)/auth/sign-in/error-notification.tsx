'use client'

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
