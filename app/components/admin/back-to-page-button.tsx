'use client'

import { useRouter } from 'next/navigation'

/**
 * 이전 페이지 이동 버튼
 * @constructor
 */
export default function BackToPageButton() {
  const router = useRouter()
  return (
    <button
      type={'button'}
      onClick={() => router.back()}
      className={
        'w-full rounded-xl bg-neutral-900 p-2 text-center text-white transition-all hover:bg-neutral-700'
      }
    >
      Go back to the previous page
    </button>
  )
}
