import { getGenerations } from '@/lib/fetcher/get-generations'
import Image from 'next/image'
import formatUserName from '@/lib/format-user-name'
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import LinkedIn from '@/app/components/svg/linked-in'
import InstagramWhiteBg from '@/app/components/svg/instagram-white-bg'
import Github from '@/app/components/svg/github'

type UserProfileType = Awaited<
  ReturnType<typeof getGenerations>
>[number]['parts'][number]['usersToParts'][number]['user']

export default function UserProfileCard({
  userData,
}: {
  userData: UserProfileType
}) {
  return (
    <div className={'flex flex-col gap-2'}>
      {userData.image ? (
        <Image
          src={userData.image}
          alt={userData.name + ' Profile Image'}
          width={100}
          height={100}
          className={'aspect-41/55 w-full max-w-32 rounded-xl object-cover'}
        />
      ) : (
        <div
          className={'aspect-41/55 w-full max-w-52 rounded-3xl bg-neutral-500'}
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
      <div className={'flex w-full items-center justify-start gap-2'}>
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
