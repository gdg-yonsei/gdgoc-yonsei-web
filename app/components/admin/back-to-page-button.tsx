'use client'

/**
 * 브라우저 기록상 이전 페이지로 돌아가는 버튼(클라이언트 컴포넌트).
 */
import { useRouter } from 'next/navigation'

/** `router.back()`을 호출하는 버튼. */
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
