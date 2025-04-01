'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getGenerations } from '@/lib/fetcher/get-generations'
import Image from 'next/image'
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import LinkedIn from '@/app/components/svg/linked-in'
import Github from '@/app/components/svg/github'
import formatUserName from '@/lib/format-user-name'
import InstagramWhiteBg from '@/app/components/svg/instagram-white-bg'

type UserProfileType = Awaited<
  ReturnType<typeof getGenerations>
>[number]['parts'][number]['usersToParts'][number]['user']

function UserProfileCard({ userData }: { userData: UserProfileType }) {
  return (
    <div className={'flex flex-col gap-2'}>
      {userData.image ? (
        <Image
          src={userData.image}
          alt={userData.name + ' Profile Image'}
          width={100}
          height={100}
          className={'w-full aspect-41/55 max-w-52 rounded-3xl object-cover'}
        />
      ) : (
        <div
          className={'w-full aspect-41/55 max-w-52 rounded-3xl bg-blue-500'}
        />
      )}
      <div className={'text-xl font-semibold underline'}>
        {formatUserName(
          userData.name,
          userData.firstName,
          userData.lastName,
          userData.isForeigner
        )}
      </div>
      <div className={'w-full flex items-center justify-start gap-2'}>
        {userData.email && (
          <Link href={`mailto:${userData.email}`}>
            <EnvelopeIcon className={'size-10'} />
          </Link>
        )}
        {userData.linkedInId && (
          <Link href={userData.linkedInId} target={'_blank'}>
            <LinkedIn className={'size-8'} />
          </Link>
        )}
        {userData.instagramId && (
          <Link
            href={'https://www.instagram.com/' + userData.instagramId}
            target={'_blank'}
          >
            <InstagramWhiteBg className={'size-10'} />
          </Link>
        )}
        {userData.githubId && (
          <Link
            href={'https://github.com/' + userData.githubId}
            target={'_blank'}
          >
            <Github className={'size-8'} />
          </Link>
        )}
      </div>
    </div>
  )
}

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
          className={'flex flex-col gap-4 border-b-2 pb-24 last:border-b-0'}
        >
          <div className={'text-4xl font-bold w-full max-w-4xl mx-auto px-4'}>
            {part.name}
          </div>
          <div
            className={
              'grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full max-w-4xl mx-auto px-4'
            }
          >
            {part.usersToParts?.map((user, j) => (
              <UserProfileCard userData={user.user} key={j} />
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
