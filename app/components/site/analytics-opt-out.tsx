'use client'

/**
 * 처리방침에서 방문 분석 수집을 끄고 켠다. 서버는 설정을 모르므로 하이드레이션 전에는 아무것도 그리지 않는다.
 * 같은 탭에서는 storage 이벤트가 오지 않아 직접 변경 이벤트를 보낸다.
 */
import { useSyncExternalStore } from 'react'
import { OPT_OUT_STORAGE_KEY } from '@/lib/analytics/constants'
import { optIn, optOut } from '@/lib/analytics/tracker/identity'

export type AnalyticsOptOutCopy = {
  enabled: string
  disabled: string
  gpc: string
  disable: string
  enable: string
}

type Status = 'unknown' | 'gpc' | 'enabled' | 'disabled'

const CHANGE_EVENT = 'gyms-analytics-consent'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function readStatus(): Status {
  if (
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  ) {
    return 'gpc'
  }
  try {
    return localStorage.getItem(OPT_OUT_STORAGE_KEY) === '1'
      ? 'disabled'
      : 'enabled'
  } catch {
    // 저장소를 쓸 수 없으면 거부 설정을 남길 수 없다. 수집기도 페이지를 넘어 이어지는 기록을 만들지 못한다.
    return 'unknown'
  }
}

const readServerStatus = (): Status => 'unknown'

/** `buttonClassName`은 서버 부모가 만든다. 버튼 클래스 도우미(tailwind-merge)를 공개 클라이언트 번들에 넣지 않기 위해서다. */
export default function AnalyticsOptOut({
  copy,
  buttonClassName,
}: {
  copy: AnalyticsOptOutCopy
  buttonClassName: string
}) {
  const status = useSyncExternalStore(subscribe, readStatus, readServerStatus)

  if (status === 'unknown') return null
  if (status === 'gpc') return <p role="status">{copy.gpc}</p>

  function toggle() {
    if (status === 'enabled') optOut(localStorage)
    else optIn(localStorage)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <div className="policy-note no-print">
      <p role="status">{status === 'enabled' ? copy.enabled : copy.disabled}</p>
      <button type="button" onClick={toggle} className={buttonClassName}>
        {status === 'enabled' ? copy.disable : copy.enable}
      </button>
    </div>
  )
}
