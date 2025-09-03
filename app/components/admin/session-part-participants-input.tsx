'use client'

import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import { useEffect, useState } from 'react'
import formatUserName from '@/lib/format-user-name'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'

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
  const [partId, setPartId] = useState<number>(0)
  const [partMembers, setPartMembers] = useState<
    Awaited<
      ReturnType<typeof getParts>
    >[0]['parts'][0]['usersToParts'][0]['user'][]
  >([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    if (defaultValue) {
      setPartId(defaultValue.partId)
      setSelectedMembers(defaultValue.selectedMembers)
      const allParts = generationData.flatMap((generation) =>
        generation.parts.map((part) => part)
      )
      const selectedPart = allParts.filter(
        (part) => part.id === defaultValue.partId
      )
      setPartMembers(
        selectedPart.flatMap((userToPart) =>
          userToPart.usersToParts.map((user) => user.user)
        )
      )
    }
  }, [defaultValue, generationData])

  return (
    <>
      <div
        className={
          'col-span-3 flex h-48 w-full items-start justify-between gap-4'
        }
      >
        {/* Parts 섹션 */}
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>Parts</p>
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
                      setPartMembers(
                        part.usersToParts.map((userToPart) => userToPart.user)
                      )
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
          <p>Members</p>
          {/* 이 div가 스크롤 영역이 됩니다. */}
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'flex flex-col gap-1 pt-2'}>
              {partMembers.map((member) => (
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
          'col-span-4 flex h-48 w-full items-start justify-between gap-4'
        }
      >
        {/* Members 섹션 */}
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>Members</p>
          {/* 이 div가 스크롤 영역이 됩니다. */}
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'grid grid-cols-4 gap-1 pt-2'}>
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
    </>
  )
}
