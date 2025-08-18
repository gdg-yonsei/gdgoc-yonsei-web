'use client'

import { getParts } from '@/lib/fetcher/admin/get-parts'
import { useEffect, useState } from 'react'

export default function SessionPartParticipantsInput({
  generationData,
  defaultValue,
}: {
  generationData: Awaited<ReturnType<typeof getParts>>
  defaultValue?: {
    partId: number
    selectedMembers: string[]
  }
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
    <div className={'col-span-3 flex w-full items-start justify-between gap-4'}>
      <div className={'w-full rounded-lg bg-white p-2'}>
        <p>Parts</p>
        <div className={'flex w-full flex-col gap-2'}>
          <input hidden={true} name={'partId'} value={partId} readOnly={true} />
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
                    part.usersToParts.map((userToPart) => userToPart.user.id)
                  )
                }}
                className={`${partId === part.id ? 'bg-neutral-950 text-white' : ''} rounded-lg p-1`}
              >
                {part.name}
              </button>
            ))
          )}
        </div>
      </div>
      <div className={'h-full w-full rounded-lg bg-white p-2'}>
        <p>Members</p>
        <div>
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
              {member.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
