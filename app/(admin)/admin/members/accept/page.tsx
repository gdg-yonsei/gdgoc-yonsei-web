import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import AdminEmptyState from '@/app/components/admin/empty-state'
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
      <AdminPageHeader
        title={t.approveMember}
        backHref={'/admin/members'}
        backLabel={t.members}
      />
      <div className={'flex w-full flex-col gap-2'}>
        {unacceptedMembers.length === 0 && (
          <AdminEmptyState title={t.noUsersToApprove} />
        )}
        {unacceptedMembers.map((member) => (
          <div
            key={member.id}
            className={
              'border-hairline bg-surface flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between'
            }
          >
            <div className={'flex min-w-0 items-center gap-2.5'}>
              <Image
                src={member.image ? member.image : '/default-user-profile.png'}
                alt={''}
                width={100}
                height={100}
                className={'size-10 shrink-0 rounded-lg object-cover'}
              />
              <div className={'type-body-sm text-ink truncate font-semibold'}>
                {member.name}
              </div>
            </div>
            {/* 좁은 화면에서 버튼이 압축되어 라벨이 줄바꿈되지 않도록 감쌉니다. */}
            <div className={'flex flex-wrap items-center gap-2'}>
              <AcceptForm userId={member.id} />
              <DeleteForm userId={member.id} />
            </div>
          </div>
        ))}
      </div>
    </AdminDefaultLayout>
  )
}
