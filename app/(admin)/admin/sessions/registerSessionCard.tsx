import Link from 'next/link'

const formatter = new Intl.DateTimeFormat('ko-KR', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false, // 24시간제, true로 하면 오전/오후 붙음
})

/**
 * `RegisterSessionCard` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
