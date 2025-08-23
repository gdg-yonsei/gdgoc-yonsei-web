'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorNotification() {
  const searchParams = useSearchParams()

  const search = searchParams.get('error')
  return <p className={'text-sm text-red-600'}>{search}</p>
}
