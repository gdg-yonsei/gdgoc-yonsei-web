import Link from 'next/link'

const formatter = new Intl.DateTimeFormat('ko-KR', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false, // 24시간제, true로 하면 오전/오후 붙음
})

export default function RegisterSessionCard({
  sessionId,
  sessionName,
  part,
  startAt,
  endAt,
  maxCapacity,
  participants,
}: {
  sessionId: string
  sessionName: string
  part: string
  startAt: Date | null
  endAt: Date | null
  maxCapacity: number | null
  participants: number
}) {
  return (
    <Link
      href={`/admin/sessions/${sessionId}/register`}
      className={'rounded-xl border-2 border-neutral-950 bg-white'}
    >
      <div
        className={'rounded-t-lg bg-neutral-900 p-1 px-3 text-sm text-white'}
      >
        {part} Part
      </div>
      <div className={'flex flex-col gap-2 p-2'}>
        <h3 className={'mx-auto p-2 text-xl font-bold'}>{sessionName}</h3>

        <div className={'ml-auto text-sm'}>
          <p>Start: {startAt ? formatter.format(startAt) : 'TBD'}</p>
          <p className={''}>End: {endAt ? formatter.format(endAt) : 'TBD'}</p>
        </div>

        <div className={'ml-auto'}>
          {participants} / {maxCapacity}
        </div>
      </div>
    </Link>
  )
}
