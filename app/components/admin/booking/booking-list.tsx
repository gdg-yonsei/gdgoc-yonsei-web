'use client'

import { useState } from 'react'
import type { BookingRequestListItem } from '@/lib/server/fetcher/admin/get-booking-requests'
import { deleteBookingAction } from '@/lib/server/actions/booking/delete-booking'

const statusColors: Record<string, string> = {
  PENDING: 'bg-warning-soft text-warning',
  SCHEDULED: 'bg-primary-soft text-primary',
  SUCCESS: 'bg-success-soft text-success',
  FAILED: 'bg-danger-soft text-danger',
}

const statusLabels: Record<string, string> = {
  PENDING: '대기중',
  SCHEDULED: '예약 예정',
  SUCCESS: '예약 완료',
  FAILED: '예약 실패',
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function BookingCard({ booking }: { booking: BookingRequestListItem }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('이 예약을 삭제하시겠습니까?')) return
    setDeleting(true)
    const result = await deleteBookingAction(booking.id)
    if (!result.success) {
      alert(result.error || '삭제에 실패했습니다')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-canvas flex flex-col gap-2 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{booking.eventName}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status] || 'bg-surface-sunken text-ink-secondary'}`}
        >
          {statusLabels[booking.status] || booking.status}
        </span>
      </div>
      <div className="text-ink-muted grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
        <p>
          <span className="text-ink-secondary font-medium">장소:</span>{' '}
          {booking.building} - {booking.roomName}
        </p>
        <p>
          <span className="text-ink-secondary font-medium">캠퍼스:</span>{' '}
          {booking.campus}
        </p>
        <p>
          <span className="text-ink-secondary font-medium">시작:</span>{' '}
          {formatDateTime(booking.startTime)}
        </p>
        <p>
          <span className="text-ink-secondary font-medium">종료:</span>{' '}
          {formatDateTime(booking.endTime)}
        </p>
        <p>
          <span className="text-ink-secondary font-medium">유형:</span>{' '}
          {booking.eventType}
        </p>
        <p>
          <span className="text-ink-secondary font-medium">참석 인원:</span>{' '}
          {booking.attendees}명
        </p>
        <p>
          <span className="text-ink-secondary font-medium">연락처:</span>{' '}
          {booking.contactPhone}
        </p>
        <p>
          <span className="text-ink-secondary font-medium">신청자:</span>{' '}
          {booking.requestedByName || '-'}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-ink-faint text-xs">
          신청일: {formatDateTime(booking.createdAt)}
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-danger-soft text-danger hover:bg-danger-soft rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </div>
  )
}

export default function BookingList({
  bookings,
}: {
  bookings: BookingRequestListItem[]
}) {
  if (bookings.length === 0) {
    return (
      <div className="bg-canvas text-ink-muted rounded-xl p-6 text-center text-sm">
        등록된 예약이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
