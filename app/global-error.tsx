'use client' // Error boundaries must be Client Components

import './globals.css'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'

/**
 * `GlobalError` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

  return (
    <html>
      <head>
        <title>Something went wrong!</title>
      </head>
      <body
        className={
          'flex h-screen w-screen flex-col items-center justify-center bg-neutral-50 p-4'
        }
      >
        <div
          className={
            'flex w-full max-w-4xl flex-col gap-2 rounded-xl border-2 border-neutral-300 bg-white p-4'
          }
        >
          <GDGoCYonseiLogo />
          <h2 className={'text-4xl font-bold'}>Something went wrong!</h2>
          <button
            onClick={reset}
            className={
              'w-full rounded-lg bg-neutral-950 p-2 text-center text-white'
            }
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
