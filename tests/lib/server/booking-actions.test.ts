import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockRevalidatePath = vi.fn()
const mockCookies = vi.fn()
const mockForbidden = vi.fn(() => 'FORBIDDEN')
const mockInvalidateAllPublicCache = vi.fn()

const mockDbExecute = vi.fn()
const mockDbInsert = vi.fn()
const mockDbInsertValues = vi.fn()
const mockDbDelete = vi.fn()
const mockDbDeleteWhere = vi.fn()
const mockDbSelect = vi.fn()
const mockDbSelectFrom = vi.fn()
const mockDbSelectWhere = vi.fn()
const mockDbSelectLimit = vi.fn()

const mockFetch = vi.fn()

vi.mock('@/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/server/permission/handle-permission', () => ({
  default: mockHandlePermission,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

vi.mock('next/navigation', () => ({
  forbidden: mockForbidden,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateAllPublicCache: mockInvalidateAllPublicCache,
}))

vi.mock('@/db', () => ({
  default: {
    execute: mockDbExecute,
    insert: mockDbInsert,
    delete: mockDbDelete,
    select: mockDbSelect,
  },
}))

function createBookingFormData(
  overrides: Partial<Record<string, string>> = {}
): FormData {
  const formData = new FormData()

  const startAt = new Date()
  startAt.setDate(startAt.getDate() + 20)
  startAt.setHours(10, 0, 0, 0)

  const endAt = new Date(startAt)
  endAt.setHours(12, 0, 0, 0)

  const toLocalDateTime = (date: Date) => {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  const entries = {
    roomName: 'Student Hall 101',
    building: 'Student Hall',
    campus: 'Sinchon',
    startTime: toLocalDateTime(startAt),
    endTime: toLocalDateTime(endAt),
    eventName: 'GDGoC Weekly Session',
    eventType: 'Study',
    attendees: '30',
    contactPhone: '010-1234-5678',
    ...overrides,
  }

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value)
  }

  return formData
}

describe('booking-related server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mockFetch)

    mockAuth.mockResolvedValue({
      user: {
        id: 'lead-user-id',
        email: 'lead@gdgoc.test',
      },
    })
    mockHandlePermission.mockResolvedValue(true)

    mockDbExecute.mockResolvedValue([{ id: 42, status: 'PENDING' }])
    mockDbInsertValues.mockResolvedValue(undefined)
    mockDbInsert.mockReturnValue({ values: mockDbInsertValues })

    mockDbDeleteWhere.mockResolvedValue(undefined)
    mockDbDelete.mockReturnValue({ where: mockDbDeleteWhere })

    mockDbSelectLimit.mockResolvedValue([{ externalId: '42' }])
    mockDbSelectWhere.mockReturnValue({ limit: mockDbSelectLimit })
    mockDbSelectFrom.mockReturnValue({ where: mockDbSelectWhere })
    mockDbSelect.mockReturnValue({ from: mockDbSelectFrom })

    mockCookies.mockResolvedValue({
      get: (name: string) =>
        name === 'authjs.session-token'
          ? { value: 'session-token' }
          : undefined,
    })

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ campus: { buildings: [], rooms: [] } }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
  })

  it('blocks booking creation when the user lacks booking permission', async () => {
    mockHandlePermission.mockResolvedValue(false)

    const { requestBookingAction } =
      await import('@/lib/server/actions/booking/request-booking')

    const result = await requestBookingAction(createBookingFormData())

    expect(result).toEqual({ success: false, error: 'Forbidden' })
    expect(mockDbExecute).not.toHaveBeenCalled()
  })

  it('rejects bookings that bypass the two-week lead-time rule', async () => {
    const tooSoon = new Date()
    tooSoon.setDate(tooSoon.getDate() + 7)
    tooSoon.setHours(10, 0, 0, 0)

    const tooSoonEnd = new Date(tooSoon)
    tooSoonEnd.setHours(12, 0, 0, 0)

    const toLocalDateTime = (date: Date) => {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const hh = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')

      return `${yyyy}-${mm}-${dd}T${hh}:${min}`
    }

    const { requestBookingAction } =
      await import('@/lib/server/actions/booking/request-booking')

    const result = await requestBookingAction(
      createBookingFormData({
        startTime: toLocalDateTime(tooSoon),
        endTime: toLocalDateTime(tooSoonEnd),
      })
    )

    expect(result).toEqual({
      success: false,
      error: '예약은 최소 2주 이후 일정만 신청할 수 있습니다',
    })
    expect(mockDbExecute).not.toHaveBeenCalled()
  })

  it('accepts valid booking requests using datetime-local input values', async () => {
    const { requestBookingAction } =
      await import('@/lib/server/actions/booking/request-booking')

    const result = await requestBookingAction(createBookingFormData())

    expect(result).toEqual({
      success: true,
      data: { id: 42, status: 'PENDING' },
    })
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: '42',
        requestedById: 'lead-user-id',
        roomName: 'Student Hall 101',
      })
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/booking')
  })

  it('blocks booking deletion when the user lacks permission', async () => {
    mockHandlePermission.mockResolvedValue(false)

    const { deleteBookingAction } =
      await import('@/lib/server/actions/booking/delete-booking')

    const result = await deleteBookingAction(
      '00000000-0000-4000-8000-000000000123'
    )

    expect(result).toEqual({ success: false, error: 'Forbidden' })
    expect(mockDbDelete).not.toHaveBeenCalled()
  })

  it('rejects deletion when the linked external booking id is malformed', async () => {
    mockDbSelectLimit.mockResolvedValue([{ externalId: 'not-a-number' }])

    const { deleteBookingAction } =
      await import('@/lib/server/actions/booking/delete-booking')

    const result = await deleteBookingAction(
      '00000000-0000-4000-8000-000000000123'
    )

    expect(result).toEqual({
      success: false,
      error: 'Invalid external booking ID',
    })
    expect(mockDbDelete).not.toHaveBeenCalled()
  })

  it('requires booking page permission before exposing venue data', async () => {
    mockHandlePermission.mockResolvedValue(false)

    const { getVenuesAction } =
      await import('@/lib/server/actions/booking/get-venues')

    const result = await getVenuesAction()

    expect(result).toEqual({ success: false, error: 'Forbidden' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('forwards session token to the booking venue service for authorized users', async () => {
    const { getVenuesAction } =
      await import('@/lib/server/actions/booking/get-venues')

    const result = await getVenuesAction()

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('https://auto-booker.moveto.kr/api/venues'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Session-Token': 'session-token',
        }),
      })
    )
  })

  it('refuses insecure booking API base urls in production', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousBookingUrl = process.env.AUTO_BOOKER_URL

    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('AUTO_BOOKER_URL', 'http://booking.test')

    const { bookingFetch } =
      await import('@/lib/server/actions/booking/booking-fetch')

    await expect(bookingFetch('/api/venues')).rejects.toThrow(
      'AUTO_BOOKER_URL must use https in production.'
    )

    vi.stubEnv('NODE_ENV', previousNodeEnv)
    if (previousBookingUrl) {
      vi.stubEnv('AUTO_BOOKER_URL', previousBookingUrl)
    } else {
      vi.unstubAllEnvs()
    }
  })
})

describe('refresh-all-data action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'core-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
  })

  it('denies cache refresh when the caller is not allowed on admin pages', async () => {
    mockHandlePermission.mockResolvedValue(false)

    const revalidateAllDataAction = (
      await import('@/app/components/admin/refresh-all-data-button/actions')
    ).default

    const result = await revalidateAllDataAction()

    expect(mockForbidden).toHaveBeenCalled()
    expect(result).toBe('FORBIDDEN')
    expect(mockInvalidateAllPublicCache).not.toHaveBeenCalled()
  })

  it('refreshes cache only for authorized admin users', async () => {
    const revalidateAllDataAction = (
      await import('@/app/components/admin/refresh-all-data-button/actions')
    ).default

    await revalidateAllDataAction()

    expect(mockInvalidateAllPublicCache).toHaveBeenCalledTimes(1)
  })
})
