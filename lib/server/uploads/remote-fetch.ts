// 리다이렉트마다 DNS가 사설·루프백·링크 로컬 등 차단 대역인지 검사하며 크기·전송 시간을 제한한다.
import 'server-only'

import { lookup as dnsLookup } from 'node:dns'
import { BlockList, isIP } from 'node:net'
import { Agent, fetch as undiciFetch } from 'undici'

export type UploadErrorCode =
  'BLOCKED_URL' | 'TOO_LARGE' | 'NOT_IMAGE' | 'FETCH_FAILED'

export class UploadError extends Error {
  constructor(
    readonly code: UploadErrorCode,
    message: string
  ) {
    super(message)
  }
}

/** 연결을 거부할 IP 대역(사설망, 루프백, 문서용, 멀티캐스트 등). */
const blocked = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  // IPv4-compatible(::a.b.c.d)·미지정·루프백 주소를 포함한다.
  ['::', 96],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  // 6to4: 안에 임의의 IPv4(사설 포함)를 담을 수 있다.
  ['2002::', 16],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv6')
}

/** 사설·루프백·링크로컬·예약 대역이 아닌 공인 주소인지. IPv4-mapped IPv6 도 풀어서 본다. */
export function isPublicAddress(address: string): boolean {
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  const ip = mapped?.[1] ?? address
  const family = isIP(ip)
  if (family === 0) return false
  return !blocked.check(ip, family === 4 ? 'ipv4' : 'ipv6')
}

type LookupFn = (hostname: string) => Promise<string>

const defaultLookup: LookupFn = (hostname) =>
  new Promise((resolve, reject) =>
    dnsLookup(hostname, (error, address) =>
      error ? reject(error) : resolve(address)
    )
  )

// 연결 시에도 IP를 검사해 검증 후 DNS가 바뀌는 rebinding으로 내부망에 연결하지 않게 한다.
const HEADERS_TIMEOUT_MS = 30_000
/** 200MB 를 느린 원본에서 받는 데 필요한 전체 전송 한도. */
const TRANSFER_TIMEOUT_MS = 10 * 60 * 1000

const pinnedDispatcher = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      dnsLookup(hostname, options, (error, address, family) => {
        if (error) return callback(error, address, family)
        const addresses = Array.isArray(address)
          ? address
          : [{ address, family }]
        if (
          addresses.some(
            (entry) =>
              !isPublicAddress(
                typeof entry === 'string' ? entry : entry.address
              )
          )
        ) {
          return callback(
            new UploadError(
              'BLOCKED_URL',
              'The URL resolves to a non-public address.'
            ),
            address,
            family
          )
        }
        callback(null, address, family)
      })
    },
  },
})

const defaultFetch = ((url: URL, init: RequestInit) =>
  undiciFetch(url, {
    ...(init as Parameters<typeof undiciFetch>[1]),
    dispatcher: pinnedDispatcher,
  })) as unknown as typeof fetch

// 자격 증명 없는 HTTPS만 허용하고 매 홉 공인 DNS·maxRedirects·image/*·선언 크기를 검사한다.
// 실제 크기 한도는 R2 업로드에서 스트림을 읽으며 다시 강제한다.
export async function fetchPublicImage(
  rawUrl: string,
  opts: {
    maxBytes: number
    maxRedirects?: number
    lookup?: LookupFn
    fetchImpl?: typeof fetch
    headersTimeoutMs?: number
  }
): Promise<{
  body: ReadableStream<Uint8Array>
  contentType: string
  contentLength: number | null
}> {
  const lookup = opts.lookup ?? defaultLookup
  const fetchImpl = opts.fetchImpl ?? defaultFetch
  const maxRedirects = opts.maxRedirects ?? 3
  // 전체 전송은 10분, 응답 헤더까지는 30초. 헤더가 오면 그 타이머만 푼다.
  const transfer = AbortSignal.timeout(TRANSFER_TIMEOUT_MS)

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UploadError('BLOCKED_URL', 'The URL is not valid.')
  }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new UploadError(
        'BLOCKED_URL',
        'Only public https URLs are allowed.'
      )
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, '')
    let address: string
    try {
      address = isIP(hostname) ? hostname : await lookup(hostname)
    } catch {
      throw new UploadError('FETCH_FAILED', 'The host could not be resolved.')
    }
    if (!isPublicAddress(address)) {
      throw new UploadError(
        'BLOCKED_URL',
        'The URL resolves to a non-public address.'
      )
    }

    const headersWait = new AbortController()
    const headersTimer = setTimeout(
      () => headersWait.abort(new Error('headers timeout')),
      opts.headersTimeoutMs ?? HEADERS_TIMEOUT_MS
    )
    let response: Response
    try {
      response = await fetchImpl(url, {
        redirect: 'manual',
        signal: AbortSignal.any([transfer, headersWait.signal]),
      })
    } catch (error) {
      if (error instanceof UploadError) throw error
      throw new UploadError(
        'FETCH_FAILED',
        'The image could not be downloaded.'
      )
    } finally {
      clearTimeout(headersTimer)
    }

    if (response.status >= 300 && response.status < 400) {
      // 따라가지 않는 응답 본문은 바로 닫아 연결을 돌려준다.
      await response.body?.cancel().catch(() => undefined)
      const location = response.headers.get('location')
      if (!location) {
        throw new UploadError('FETCH_FAILED', 'Redirect without a location.')
      }
      url = new URL(location, url)
      continue
    }

    if (!response.ok || !response.body) {
      throw new UploadError(
        'FETCH_FAILED',
        `The remote server answered ${response.status}.`
      )
    }

    const contentType =
      response.headers
        .get('content-type')
        ?.split(';')[0]
        ?.trim()
        .toLowerCase() ?? ''
    if (!contentType.startsWith('image/')) {
      throw new UploadError('NOT_IMAGE', 'The URL does not point to an image.')
    }

    const declared = Number(response.headers.get('content-length'))
    const contentLength =
      response.headers.has('content-length') && Number.isFinite(declared)
        ? declared
        : null
    if (contentLength !== null && contentLength > opts.maxBytes) {
      throw new UploadError('TOO_LARGE', 'The image exceeds the 200MB limit.')
    }

    return { body: response.body, contentType, contentLength }
  }

  throw new UploadError('BLOCKED_URL', 'Too many redirects.')
}
