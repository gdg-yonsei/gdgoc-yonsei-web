export function getBookingApiBaseUrl(): URL {
  const baseUrl = new URL(
    process.env.AUTO_BOOKER_URL || 'https://auto-booker.moveto.kr'
  )

  if (process.env.NODE_ENV === 'production' && baseUrl.protocol !== 'https:') {
    throw new Error('AUTO_BOOKER_URL must use https in production.')
  }

  return baseUrl
}

export async function bookingFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = new URL(path, getBookingApiBaseUrl())
  return fetch(url, init)
}
