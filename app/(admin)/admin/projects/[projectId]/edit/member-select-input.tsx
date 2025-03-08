'use client'

import { getMembersWithGeneration } from '@/lib/fetcher/admin/get-members-with-generation'
import { useEffect, useState } from 'react'

export default function MembersSelectInput({
  membersList,
  defaultValue,
}: {
  membersList: Awaited<ReturnType<typeof getMembersWithGeneration>>
  defaultValue: string[]
}) {
  const [participants, setParticipants] = useState<string[]>([])
  const [generations, setGenerations] = useState<number[]>([])

  function handleSelectMember(memberId: string) {
    if (participants.includes(memberId)) {
      setParticipants(participants.filter((id) => id !== memberId))
    } else {
      setParticipants([...participants, memberId])
    }
  }

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
    <div className={'col-span-4'}>
      <input
        readOnly={true}
        value={JSON.stringify(participants)}
        hidden={true}
        name={'participants'}
      />
      <div className={'w-full flex flex-col gap-2'}>
        {membersList.map((generation, i) => (
          <div key={i}>
            <div className={'flex items-center px-2 gap-2'}>
              <div className={'text-sm text-neutral-700'}>
                {generation.name}
              </div>
              <button
                type={'button'}
                onClick={() => handleToggleGeneration(generation.id)}
                className={'text-sm text-neutral-700'}
              >
                {generations.includes(generation.id) ? 'Close' : 'Open'}
              </button>
            </div>
            <div
              className={`grid grid-cols-4 gap-2 w-full transition-all ${generations.includes(generation.id) ? '' : 'hidden'}`}
            >
              {generation.parts.map((part) =>
                part.usersToParts.map((user) => (
                  <button
                    type={'button'}
                    key={`${part.id}-${user.user.id}`}
                    className={`p-1 px-2 rounded-lg  flex flex-col items-start ${participants.includes(user.user.id) ? 'bg-neutral-900 text-white' : 'bg-white'}`}
                    onClick={() => handleSelectMember(user.user.id)}
                  >
                    <div className={'text-sm'}>{part.name}</div>
                    <div>{user.user.name}</div>
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
