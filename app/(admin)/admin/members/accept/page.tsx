import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema/users'
import AcceptForm from '@/app/(admin)/admin/members/accept/accept-form'
import Image from 'next/image'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Approve Members',
}

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
            <AcceptForm userId={member.id} />
          </div>
        ))}
      </div>
    </AdminDefaultLayout>
  )
}
