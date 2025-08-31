import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema/users'
import db from '@/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * 관리자 홈페이지
 * @constructor
 */
export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  // 사용자의 이름 정보가 업데이트 되어 있는지 확인
  const userInfo = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      firstName: true,
      lastName: true,
    },
  })
  // 만약 사용자 이름 정보가 없다면 프로필 수정 페이지로 리다이렉트
  if (!userInfo?.firstName || !userInfo?.lastName) {
    redirect('/admin/profile/edit')
  }

  return (
    <AdminDefaultLayout className={'flex w-full flex-col gap-4 p-4'}>
      <div className={'admin-title'}>Home</div>
      <div className={'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'}>
        <QRCodeGenerator />

        <div
          className={
            'flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-4'
          }
        >
          <p className={'text-center text-2xl font-semibold'}>
            Subscribe to Calendar
          </p>
          <div className={'flex w-full flex-col gap-2'}>
            <div className={'flex w-full items-center justify-between gap-2'}>
              <Link
                className={
                  'w-full rounded-full bg-neutral-900 p-2 text-center text-white ring-2 ring-neutral-950 transition-all hover:bg-neutral-800 hover:ring-offset-2'
                }
                href={
                  'https://calendar.google.com/calendar/u/0?cid=Njc3NjI4ZDUyODM0Mjk5NjViZTE3MmMxMzVmZjBjNjc4MzA3OTVlNWFkZmIzYmMxMTc4MmIzMDVkMTRiMzkyY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t'
                }
                target={'_blank'}
              >
                Google Calendar
              </Link>
              <Link
                className={
                  'w-full rounded-full bg-neutral-900 p-2 text-center text-white ring-2 ring-neutral-950 transition-all hover:bg-neutral-800 hover:ring-offset-2'
                }
                href={
                  'webcal://calendar.google.com/calendar/ical/677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com/public/basic.ics'
                }
              >
                Apple Calendar
              </Link>
            </div>
            <div>
              <p className={'text-lg font-semibold'}>Samsung Galaxy</p>
              <div className={'rounded-lg bg-neutral-200 p-1 break-all'}>
                https://calendar.google.com/calendar/ical/677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com/public/basic.ics
              </div>
              <p className={'pt-1'}>1. Copy the calendar address above.</p>
              <p>
                2. Open the Calendar app and paste the address to subscribe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
