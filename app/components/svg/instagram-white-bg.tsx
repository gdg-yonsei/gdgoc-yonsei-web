import { SVGProps } from 'react'

/**
 * `InstagramWhiteBg` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default function InstagramWhiteBg({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <rect width="24" height="24" rx="6" fill="oklch(0.985 0 0)" />
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="4.25"
        stroke="#000000"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4.25" stroke="#000000" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="#000000" />
    </svg>
  )
}
