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
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: 'Approve Members',
}

export default async function AcceptMemberPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const unacceptedMembers = await db.query.users.findMany({
    where: eq(users.role, 'UNVERIFIED'),
  })

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/members'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.members}</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>{t.approveMember}</div>
      <div className={'flex w-full flex-col gap-2 py-4'}>
        {unacceptedMembers.length === 0 && (
          <div className={'text-ink mx-auto text-xl'}>{t.noUsersToApprove}</div>
        )}
        {unacceptedMembers.map((member) => (
          <div
            key={member.id}
            className={
              'bg-surface flex items-center justify-between gap-2 rounded-lg p-2 not-md:flex-col not-md:items-start'
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
