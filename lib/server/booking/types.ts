/**
 * 예약 Server Action 결과 형태. 예약 폼 클라이언트가 이 모양을 그대로 읽는다.
 */
export type BookingActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      fieldErrors?: Record<string, string[]>
    }
