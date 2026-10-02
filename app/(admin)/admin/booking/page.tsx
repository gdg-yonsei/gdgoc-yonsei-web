/**
 * 강의실 대관 예약 화면(`/admin/booking`). 예약 현황 목록과 신청 폼을 보여 준다.
 *
 * 대관 대상이 연세대 공간 대관 시스템이라 화면은 한국어로만 제공한다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import BookingForm from '@/app/components/admin/booking/booking-form'
import BookingList from '@/app/components/admin/booking/booking-list'
import { hasPermission } from '@/lib/server/permission/has-permission'
import { getAuthSession } from '@/auth'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { redirect, forbidden } from 'next/navigation'
import { Metadata } from 'next'
import { getBookingsWithLiveStatus } from '@/lib/server/booking/sync'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Venue Booking',
}

/** 권한(`bookingPage` 조회)을 확인하고, auto-booker 최신 상태를 덧씌운 예약 목록과 신청 폼을 그린다. */
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
        <AdminPageHeader title={t.booking} />
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
