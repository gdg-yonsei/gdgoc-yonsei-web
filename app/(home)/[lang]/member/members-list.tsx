'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getGenerations } from '@/lib/fetcher/get-generations'
import UserProfileCard from '@/app/(home)/[lang]/member/user-profile-card'

export default function MembersList({
  generationData,
  lang,
}: {
  generationData: Awaited<ReturnType<typeof getGenerations>>
  lang: string
}) {
  const [generation] = useAtom(generationState)
  const partsData = generationData.filter((data) => data.name === generation)[0]
    ?.parts

  return (
    <div className={'flex w-full flex-col gap-8'}>
      {partsData?.map((part, i) => (
        <div
          key={i}
          className={
            'flex flex-col gap-4 border-b-2 border-neutral-200 pb-24 last:border-b-0'
          }
        >
          <div className={'mx-auto w-full max-w-4xl px-4 text-4xl font-bold'}>
            {part.name}
          </div>
          <div
            className={
              'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 px-4 md:grid-cols-2 lg:grid-cols-3'
            }
          >
            {part.usersToParts?.map((user, j) => (
              <UserProfileCard lang={lang} userData={user.user} key={j} />
            ))}
            {part.usersToParts.length === 0 && (
              <div className={'text-neutral-600'}>There is no member.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
