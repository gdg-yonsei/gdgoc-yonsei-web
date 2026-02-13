import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema/users'
import AcceptForm from '@/app/(admin)/admin/members/accept/accept-form'
import Image from 'next/image'
import { Metadata } from 'next'
import DeleteForm from '@/app/(admin)/admin/members/accept/delete-form'

export const metadata: Metadata = {
  title: 'Approve Members',
}

/**
 * `AcceptMemberPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function AcceptMemberPage() {
  const unacceptedMembers = await db.query.users.findMany({
    where: eq(users.role, 'UNVERIFIED'),
  })

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/members'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Members</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>Approve Member</div>
      <div className={'flex w-full flex-col gap-2 py-4'}>
        {unacceptedMembers.length === 0 && (
          <div className={'mx-auto text-xl text-neutral-800'}>
            No users to approve.
          </div>
        )}
        {unacceptedMembers.map((member) => (
          <div
            key={member.id}
            className={
              'flex items-center justify-between gap-2 rounded-lg bg-white p-2 not-md:flex-col not-md:items-start'
            }
          >
            <div className={'flex items-center gap-2'}>
              <Image
                src={member.image ? member.image : '/default-user-profile.png'}
                alt={'Profile Image'}
                width={100}
                height={100}
                className={'size-12 rounded-lg object-cover'}
              />
              <div>{member.name}</div>
            </div>
            <div className={'flex items-center gap-2'}>
              <AcceptForm userId={member.id} />
              <DeleteForm userId={member.id} />
            </div>
          </div>
        ))}
      </div>
    </AdminDefaultLayout>
  )
}
