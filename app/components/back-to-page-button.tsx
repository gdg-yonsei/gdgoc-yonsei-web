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
        'p-2 rounded-xl bg-neutral-900 text-white w-full text-center hover:bg-neutral-700 transition-all'
      }
    >
      Go back to the previous page
    </button>
  )
}
