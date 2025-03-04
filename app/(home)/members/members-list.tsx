'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getGenerations } from '@/lib/fetcher/get-generations'
import Image from 'next/image'
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import Github from '@/app/components/svg/github'
import formatUserName from '@/lib/format-user-name'

export default function MembersList({
  generationData,
}: {
  generationData: Awaited<ReturnType<typeof getGenerations>>
}) {
  const [generation] = useAtom(generationState)
  const partsData = generationData.filter((data) => data.name === generation)[0]
    ?.parts

  return (
    <div className={'w-full flex flex-col gap-8'}>
      {partsData?.map((part, i) => (
        <div
          key={i}
          className={'flex flex-col gap-4 p-4 border-b-2 pb-24 last:border-b-0'}
        >
          <div className={'text-4xl font-bold'}>{part.name}</div>
          {part.usersToParts?.map((user, j) => (
            <div key={j} className={'flex flex-col gap-2'}>
              {user.user.image ? (
                <Image
                  src={user.user.image}
                  alt={user.user.name + ' Profile Image'}
                  width={100}
                  height={100}
                  className={
                    'w-full aspect-41/55 max-w-52 rounded-3xl object-cover'
                  }
                />
              ) : (
                <div
                  className={
                    'w-full aspect-41/55 max-w-52 rounded-3xl bg-blue-500'
                  }
                />
              )}
              <div className={'text-xl font-semibold underline'}>
                {formatUserName(
                  user.user.name,
                  user.user.firstName,
                  user.user.lastName,
                  user.user.isForeigner
                )}
              </div>
              <div className={'w-full flex items-center justify-start gap-2'}>
                {user.user.email && (
                  <Link href={`mailto:${user.user.email}`}>
                    <EnvelopeIcon className={'size-10'} />
                  </Link>
                )}
                {user.user.linkedInId && (
                  <Link href={user.user.linkedInId} target={'_blank'}>
                    <LinkedIn className={'size-8'} />
                  </Link>
                )}
                {user.user.instagramId && (
                  <Link
                    href={'https://www.instagram.com/' + user.user.instagramId}
                    target={'_blank'}
                  >
                    <Instagram className={'size-10'} />
                  </Link>
                )}
                {user.user.githubId && (
                  <Link
                    href={'https://github.com/' + user.user.githubId}
                    target={'_blank'}
                  >
                    <Github className={'size-8'} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
