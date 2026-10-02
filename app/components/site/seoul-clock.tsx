'use client'

/**
 * 푸터의 서울 시각 표시(클라이언트 컴포넌트).
 */
import { useSyncExternalStore } from 'react'

/** 서울 기준 24시간제 `HH:mm` 포매터. 매 렌더마다 만들지 않도록 모듈에 하나만 둔다. */
const formatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

/** 15초마다 다시 읽게 한다(분 단위 표시라 이 정도면 충분하다). */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(id)
}

/** 클라이언트 스냅숏: 현재 서울 시각. */
const readSeoulTime = () => formatter.format(new Date())
/** 서버 스냅숏: 시각을 모른다(정적 셸이 렌더링 시점의 시각을 굳혀 버리지 않게). */
const readNothing = () => null

/**
 * 서버 렌더링과 하이드레이션에서는 "--:--"를 그리고, 이후 클라이언트에서 KST로 갱신한다.
 * @param label 시계 앞에 붙는 문구
 */
export default function SeoulClock({ label }: { label: string }) {
  const time = useSyncExternalStore(subscribe, readSeoulTime, readNothing)

  return (
    <p className="tabular-nums">
      {label} · <time>{time ?? '--:--'}</time> KST
    </p>
  )
}
