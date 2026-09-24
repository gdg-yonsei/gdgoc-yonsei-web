'use client'

import { useSyncExternalStore } from 'react'

const formatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(id)
}

const readSeoulTime = () => formatter.format(new Date())
const readNothing = () => null

/** Server and hydration render "--:--"; the client then ticks in KST. */
export default function SeoulClock({ label }: { label: string }) {
  const time = useSyncExternalStore(subscribe, readSeoulTime, readNothing)

  return (
    <p className="tabular-nums">
      {label} · <time>{time ?? '--:--'}</time> KST
    </p>
  )
}
