import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import BookingForm from '@/app/components/admin/booking/booking-form'
import BookingList from '@/app/components/admin/booking/booking-list'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { redirect, forbidden } from 'next/navigation'
import { Metadata } from 'next'
import { syncBookingStatus } from '@/lib/server/actions/booking/sync-booking-status'
import { getBookingRequests } from '@/lib/server/fetcher/admin/get-booking-requests'

export const metadata: Metadata = {
  title: 'Venue Booking',
}

export default async function BookingPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const hasPermission = await handlePermission(session.user.id, 'get', 'bookingPage')
  if (!hasPermission) {
    forbidden()
  }

  // Sync booking statuses from auto-booker API, then fetch local records
  await syncBookingStatus()
  const bookings = await getBookingRequests()

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
