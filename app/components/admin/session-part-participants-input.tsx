'use client'

import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import { useState } from 'react'
import formatUserName from '@/lib/format-user-name'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * `SessionPartParticipantsInput` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default function SessionPartParticipantsInput({
  generationData,
  defaultValue,
  membersData,
}: {
  generationData: Awaited<ReturnType<typeof getParts>>
  defaultValue?: {
    partId: number
    selectedMembers: string[]
  }
  membersData: Awaited<ReturnType<typeof getMembers>>
}) {
  const { t } = useAdminI18n()
  const [partId, setPartId] = useState<number>(defaultValue?.partId ?? 0)
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    defaultValue?.selectedMembers ?? []
  )
  const partMembers = generationData
    .flatMap((generation) => generation.parts)
    .find((part) => part.id === partId)
    ?.usersToParts.map((userToPart) => userToPart.user)
  const currentPartMembers = partMembers ?? []

  return (
    <>
      <div
        className={
          'col-span-1 flex h-48 w-full items-start justify-between gap-4 sm:col-span-3 md:col-span-4 xl:col-span-5'
        }
      >
        {/* Parts 섹션 */}
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>{t('parts')}</p>
          {/* 이 div가 스크롤 영역이 됩니다. */}
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'flex w-full flex-col gap-2 pt-2'}>
              <input
                hidden={true}
                name={'partId'}
                value={partId}
                readOnly={true}
              />
              <input
                hidden={true}
                name={'participantId'}
                value={JSON.stringify(selectedMembers)}
                readOnly={true}
              />
              {generationData.map((generation) =>
                generation.parts.map((part) => (
                  <button
                    key={part.id}
                    type={'button'}
                    onClick={() => {
                      setPartId(part.id)
                      setSelectedMembers(
                        part.usersToParts.map(
                          (userToPart) => userToPart.user.id
                        )
                      )
                    }}
                    className={`${partId === part.id ? 'bg-neutral-950 text-white' : ''} rounded-lg p-1`}
                  >
                    {generation.name} {part.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Members 섹션 */}
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>{t('members')}</p>
          {/* 이 div가 스크롤 영역이 됩니다. */}
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'flex flex-col gap-1 pt-2'}>
              {currentPartMembers.map((member) => (
                <button
                  key={member.id}
                  type={'button'}
                  className={`w-full rounded-lg p-1 ${selectedMembers.includes(member.id) ? 'bg-neutral-950 text-white' : ''}`}
                  onClick={() => {
                    if (selectedMembers.includes(member.id)) {
                      setSelectedMembers((prev) =>
                        prev.filter((item) => item !== member.id)
                      )
                    } else {
                      setSelectedMembers((prev) => [...prev, member.id])
                    }
                  }}
                >
                  {member.firstNameKo
                    ? formatUserName(
                        member.name,
                        member.firstNameKo,
                        member.lastNameKo,
                        member.isForeigner,
                        !member.isForeigner
                      )
                    : formatUserName(
                        member.name,
                        member.firstName,
                        member.lastName,
                        member.isForeigner
                      )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className={
          'col-span-1 flex h-80 w-full items-start justify-between gap-4 sm:col-span-3 md:col-span-4 xl:col-span-5'
        }
      >
        {/* Members 섹션 */}
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>{t('members')}</p>
          {/* 이 div가 스크롤 영역이 됩니다. */}
          <div className={'flex-1 overflow-y-auto'}>
            <div
              className={
                'grid grid-cols-2 gap-1 pt-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }
            >
              {membersData.map((member) => (
                <button
                  key={member.id}
                  type={'button'}
                  className={`w-full rounded-lg border-2 border-neutral-400 p-1 ${selectedMembers.includes(member.id) ? 'bg-neutral-950 text-white' : ''}`}
                  onClick={() => {
                    if (selectedMembers.includes(member.id)) {
                      setSelectedMembers((prev) =>
                        prev.filter((item) => item !== member.id)
                      )
                    } else {
                      setSelectedMembers((prev) => [...prev, member.id])
                    }
                  }}
                >
                  <p className={'text-sm'}>
                    {member.generation} {member.part}
                  </p>
                  <p className={'pb-1'}>
                    {member.firstNameKo
                      ? formatUserName(
                          member.name,
                          member.firstNameKo,
                          member.lastNameKo,
                          member.isForeigner,
                          !member.isForeigner
                        )
                      : formatUserName(
                          member.name,
                          member.firstName,
                          member.lastName,
                          member.isForeigner
                        )}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
