import { Agent } from 'undici'

const dispatcher = new Agent({
  connect: { rejectUnauthorized: false },
})

export function getBookingApiBaseUrl(): string {
  return process.env.AUTO_BOOKER_URL || 'https://auto-booker.moveto.kr'
}

export async function bookingFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${getBookingApiBaseUrl()}${path}`
  return fetch(url, {
    ...init,
    // @ts-expect-error -- undici dispatcher is not in the standard RequestInit type
    dispatcher,
  })
}
