'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorNotification() {
  const searchParams = useSearchParams()

  const search = searchParams.get('error')
  return (
    <p role={'alert'} className={'type-body-sm text-danger'}>
      {search}
    </p>
  )
}
