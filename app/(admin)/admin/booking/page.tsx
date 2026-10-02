import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import BookingForm from '@/app/components/admin/booking/booking-form'
import BookingList from '@/app/components/admin/booking/booking-list'
import { hasPermission } from '@/lib/server/permission/has-permission'
import { getAuthSession } from '@/auth'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { redirect, forbidden } from 'next/navigation'
import { Metadata } from 'next'
import { getBookingsWithLiveStatus } from '@/lib/server/booking/sync'

export const metadata: Metadata = {
  title: 'Venue Booking',
}

export default async function BookingPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  if (!(await hasPermission(session.user.id, 'get', 'bookingPage'))) {
    forbidden()
  }

  // auto-booker 원본 상태를 반영한 목록. 미러 테이블 갱신은 응답 뒤에 한다.
  const bookings = await getBookingsWithLiveStatus()

  return (
    <AdminDefaultLayout>
      <div className={'flex flex-col gap-4 p-2'}>
        <div className={'flex items-center gap-2 pb-2'}>
          <div className={'admin-title'}>{t.booking}</div>
        </div>
        <div className="flex w-full flex-col gap-4">
          <h2 className="text-xl font-bold">예약 현황</h2>
          <BookingList bookings={bookings} />
        </div>
        <div className="flex w-full items-start">
          <BookingForm />
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
