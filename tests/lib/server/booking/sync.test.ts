import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getBookingRequests: vi.fn(),
  getExternalStatuses: vi.fn(),
  updateMirrorStatus: vi.fn(),
  runAfterResponse: vi.fn(),
}))

vi.mock('@/lib/server/fetcher/admin/get-booking-requests', () => ({
  getBookingRequests: mocks.getBookingRequests,
}))
vi.mock('@/lib/server/booking/repository', () => ({
  getExternalStatuses: mocks.getExternalStatuses,
  updateMirrorStatus: mocks.updateMirrorStatus,
}))
vi.mock('@/lib/server/after-response', () => ({
  runAfterResponse: mocks.runAfterResponse,
}))
vi.mock('@/lib/server/logger', () => ({ logger: { error: vi.fn() } }))

import { getBookingsWithLiveStatus } from '@/lib/server/booking/sync'

const row = (id: string, externalId: string | null, status: string) => ({
  id,
  externalId,
  status,
})

describe('getBookingsWithLiveStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the auto-booker status and saves changes after the response', async () => {
    mocks.getBookingRequests.mockResolvedValue([
      row('a', '1', 'PENDING'),
      row('b', '2', 'PENDING'),
      row('c', null, 'PENDING'),
    ])
    mocks.getExternalStatuses.mockResolvedValue(
      new Map([
        ['1', 'SUCCESS'],
        ['2', 'PENDING'],
      ])
    )

    const result = await getBookingsWithLiveStatus()

    expect(result.map((booking) => booking.status)).toEqual([
      'SUCCESS',
      'PENDING',
      'PENDING',
    ])
    expect(mocks.getExternalStatuses).toHaveBeenCalledWith([1, 2])
    // 렌더링 중에는 쓰지 않고, 응답 뒤 작업으로만 예약한다.
    expect(mocks.updateMirrorStatus).not.toHaveBeenCalled()
    expect(mocks.runAfterResponse).toHaveBeenCalledTimes(1)

    await mocks.runAfterResponse.mock.calls[0]![1]()
    expect(mocks.updateMirrorStatus).toHaveBeenCalledWith('a', 'SUCCESS')
  })

  it('ignores unknown statuses and falls back when the source cannot be read', async () => {
    mocks.getBookingRequests.mockResolvedValue([row('a', '1', 'PENDING')])
    mocks.getExternalStatuses.mockResolvedValue(new Map([['1', 'WEIRD']]))
    expect((await getBookingsWithLiveStatus())[0]!.status).toBe('PENDING')

    mocks.getExternalStatuses.mockRejectedValue(new Error('db down'))
    expect((await getBookingsWithLiveStatus())[0]!.status).toBe('PENDING')
    expect(mocks.runAfterResponse).not.toHaveBeenCalled()
  })
})
