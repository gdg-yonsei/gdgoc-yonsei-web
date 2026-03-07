import Image from 'next/image'
import formatUserName from '@/lib/format-user-name'
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import LinkedIn from '@/app/components/svg/linked-in'
import InstagramWhiteBg from '@/app/components/svg/instagram-white-bg'
import Github from '@/app/components/svg/github'
import { getMembersByGeneration } from '@/lib/server/queries/public/members'

type UserProfileType = NonNullable<
  Awaited<ReturnType<typeof getMembersByGeneration>>
>['parts'][number]['usersToParts'][number]['user']

/**
 * `UserProfileCard` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default function UserProfileCard({
  userData,
  lang,
}: {
  userData: UserProfileType
  lang: string
}) {
  return (
    <div className={'flex w-full items-center gap-2 rounded-2xl bg-white p-4'}>
      {userData.image ? (
        <Image
          src={userData.image}
          alt={userData.name + ' Profile Image'}
          width={100}
          height={100}
          className={'aspect-square w-full max-w-20 rounded-full object-cover'}
        />
      ) : (
        <div
          className={
            'aspect-square w-full max-w-20 rounded-full bg-neutral-500'
          }
        />
      )}
      <div className={'flex w-full flex-col'}>
        <div className={'text-xl font-semibold'}>
          {lang === 'ko'
            ? userData.firstNameKo
              ? formatUserName(
                  userData.name,
                  userData.firstNameKo,
                  userData.lastNameKo,
                  userData.isForeigner,
                  true
                )
              : formatUserName(
                  userData.name,
                  userData.firstName,
                  userData.lastName,
                  userData.isForeigner
                )
            : formatUserName(
                userData.name,
                userData.firstName,
                userData.lastName,
                userData.isForeigner
              )}
        </div>
        <div className={'flex w-full items-center justify-start gap-2'}>
          {userData.email && (
            <Link href={`mailto:${userData.email}`}>
              <EnvelopeIcon className={'size-8'} />
            </Link>
          )}
          {userData.linkedInId && (
            <Link
              href={
                'https://www.linkedin.com/in/' +
                userData.linkedInId
                  .replace('https://', '')
                  .replace('www.linkedin.com/in/', '')
              }
              target={'_blank'}
            >
              <LinkedIn className={'size-6'} />
            </Link>
          )}
          {userData.instagramId && (
            <Link
              href={
                'https://www.instagram.com/' +
                userData.instagramId.replace('@', '')
              }
              target={'_blank'}
            >
              <InstagramWhiteBg className={'size-8'} />
            </Link>
          )}
          {userData.githubId && (
            <Link
              href={'https://github.com/' + userData.githubId.replace('@', '')}
              target={'_blank'}
            >
              <Github className={'size-7'} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
