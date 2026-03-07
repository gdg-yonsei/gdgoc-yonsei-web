'use client'

import { getMembersWithGeneration } from '@/lib/server/fetcher/admin/get-members-with-generation'
import { useEffect, useState } from 'react'
import formatUserName from '@/lib/format-user-name'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * `MembersSelectInput` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default function MembersSelectInput({
  membersList,
  defaultValue,
}: {
  membersList: Awaited<ReturnType<typeof getMembersWithGeneration>>
  defaultValue: string[]
}) {
  const { t } = useAdminI18n()
  const [participants, setParticipants] = useState<string[]>([])
  const [generations, setGenerations] = useState<number[]>([])

  /**
   * `handleSelectMember` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`memberId`, `string`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  function handleSelectMember(memberId: string) {
    if (participants.includes(memberId)) {
      setParticipants(participants.filter((id) => id !== memberId))
    } else {
      setParticipants([...participants, memberId])
    }
  }

  /**
   * `handleToggleGeneration` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`generationId`, `number`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  function handleToggleGeneration(generationId: number) {
    if (generations.includes(generationId)) {
      setGenerations(generations.filter((id) => id !== generationId))
    } else {
      setGenerations([...generations, generationId])
    }
  }

  useEffect(() => {
    setParticipants(defaultValue)
  }, [defaultValue])

  return (
    <div
      className={
        'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5'
      }
    >
      <input
        readOnly={true}
        value={JSON.stringify(participants)}
        hidden={true}
        name={'participants'}
      />
      <p className={'text-sm font-semibold text-neutral-700'}>
        {t('participants')}
      </p>
      <div className={'flex w-full flex-col gap-2'}>
        {membersList.map((generation, i) => (
          <div key={i}>
            <div
              className={
                'flex w-full items-center gap-2 border-b-2 border-neutral-400 px-2'
              }
            >
              <div className={'text-sm text-neutral-700'}>
                {generation.name}
              </div>
              <button
                type={'button'}
                onClick={() => handleToggleGeneration(generation.id)}
                className={'text-sm text-neutral-700'}
              >
                {generations.includes(generation.id) ? t('close') : t('open')}
              </button>
            </div>
            <div
              className={`grid w-full grid-cols-4 gap-2 py-2 transition-all ${generations.includes(generation.id) ? '' : 'hidden'}`}
            >
              {generation.parts.map((part) =>
                part.usersToParts.map((user) => (
                  <button
                    type={'button'}
                    key={`${part.id}-${user.user.id}`}
                    className={`flex flex-col items-start rounded-lg p-1 px-2 ${participants.includes(user.user.id) ? 'bg-neutral-900 text-white' : 'bg-white'}`}
                    onClick={() => handleSelectMember(user.user.id)}
                  >
                    <div className={'text-sm'}>{part.name}</div>
                    <div>
                      {formatUserName(
                        user.user.name,
                        user.user.firstNameKo,
                        user.user.lastNameKo,
                        user.user.isForeigner,
                        !user.user.isForeigner
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
