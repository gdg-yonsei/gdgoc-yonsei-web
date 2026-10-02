/**
 * 강의실 예약 입력 검증 스키마.
 */
import { z } from 'zod'
import { parseBookingDateTime } from '@/lib/server/booking/policy'

const bookingDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => parseBookingDateTime(value) !== null, {
    message: 'Invalid datetime',
  })

/** 예약 신청 폼. 시간 규칙(리드타임·10분 단위 등)은 `checkBookingWindow`가 따로 본다. */
export const requestBookingSchema = z.object({
  roomName: z.string().trim().min(1, 'Room name is required').max(120),
  building: z.string().trim().min(1, 'Building is required').max(120),
  campus: z.string().trim().min(1, 'Campus is required').max(120),
  startTime: bookingDateTimeSchema,
  endTime: bookingDateTimeSchema,
  eventName: z.string().trim().min(1, 'Event name is required').max(200),
  eventType: z.string().trim().min(1, 'Event type is required').max(120),
  attendees: z.coerce.number().int().positive('Attendees must be positive'),
  contactPhone: z
    .string()
    .trim()
    .min(1, 'Contact phone is required')
    .max(30, 'Contact phone is too long')
    .regex(
      /^[\d +()-]+$/,
      'Contact phone must contain only numbers and common phone symbols'
    ),
})

export type RequestBookingInput = z.output<typeof requestBookingSchema>

/** 삭제 대상 예약(웹 미러 행) ID. */
export const bookingIdSchema = z.string().uuid('Invalid booking ID')

/** auto-booker가 쓰는 예약 상태. 웹 미러 테이블의 enum과 같다. */
export const BOOKING_STATUSES = [
  'PENDING',
  'SCHEDULED',
  'SUCCESS',
  'FAILED',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]
