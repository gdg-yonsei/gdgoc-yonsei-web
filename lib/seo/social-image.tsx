import 'server-only'

import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { cacheLife } from 'next/cache'
import satori from 'satori'
import sharp from 'sharp'
import { layoutSocialTitle } from '@/lib/seo/social-image-title'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { logger } from '@/lib/server/logger'
import type { SocialImageContent } from '@/lib/seo/social-image-data'

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const
export const SOCIAL_IMAGE_CONTENT_TYPE = 'image/jpeg'

const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_SOURCE_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const RESIZABLE_IMAGE_HOSTS = new Set([
  'image.gdgyonsei.moveto.kr',
  'dev.image.gdgyonsei.moveto.kr',
])
const SOCIAL_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const FALLBACK_SOCIAL_IMAGE_CACHE_CONTROL =
  'public, max-age=300, stale-while-revalidate=3600'

const pretendardBoldFont = readFile(
  resolve(
    process.cwd(),
    'node_modules/pretendard/dist/web/static/woff-subset/Pretendard-Bold.subset.woff'
  )
).then(
  (font) =>
    font.buffer.slice(
      font.byteOffset,
      font.byteOffset + font.byteLength
    ) as ArrayBuffer
)

const LOCAL_IMAGE_CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function toDataUrl(
  bytes: ArrayBuffer | Uint8Array,
  contentType: string
): string {
  const byteView = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return `data:${contentType};base64,${Buffer.from(byteView).toString('base64')}`
}

function cloudflareSocialImageUrl(source: URL): URL | null {
  if (
    source.protocol !== 'https:' ||
    source.username ||
    source.password ||
    (source.port && source.port !== '443') ||
    !RESIZABLE_IMAGE_HOSTS.has(source.hostname)
  ) {
    return null
  }

  if (source.pathname.startsWith('/cdn-cgi/image/')) {
    return source
  }

  const transformed = new URL(source)
  transformed.pathname =
    '/cdn-cgi/image/width=1200,height=630,fit=cover,quality=82,format=jpeg' +
    source.pathname
  return transformed
}

async function readLocalImage(source: string): Promise<string | null> {
  const pathname = decodeURIComponent(
    new URL(source, 'https://local.invalid').pathname
  )
  const publicRoot = resolve(process.cwd(), 'public')
  const filePath = resolve(publicRoot, pathname.replace(/^\/+/, ''))

  if (!filePath.startsWith(`${publicRoot}${sep}`)) {
    return null
  }

  const contentType = LOCAL_IMAGE_CONTENT_TYPES[extname(filePath).toLowerCase()]
  if (!contentType) {
    return null
  }

  const bytes = await readFile(filePath)
  if (bytes.byteLength > MAX_SOURCE_IMAGE_BYTES) {
    return null
  }

  return toDataUrl(bytes, contentType)
}

async function fetchRemoteImage(source: string): Promise<string | null> {
  const sourceUrl = new URL(source)
  const transformedUrl = cloudflareSocialImageUrl(sourceUrl)
  if (!transformedUrl) {
    return null
  }

  const fetchImage = async (imageUrl: URL) => {
    const response = await fetch(imageUrl, {
      cache: 'force-cache',
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]
    const contentLength = Number(response.headers.get('content-length') || 0)
    if (
      !contentType ||
      !ALLOWED_SOURCE_IMAGE_TYPES.has(contentType) ||
      contentLength > MAX_SOURCE_IMAGE_BYTES
    ) {
      return null
    }

    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > MAX_SOURCE_IMAGE_BYTES) {
      return null
    }

    return { bytes, contentType }
  }

  const transformedImage = await fetchImage(transformedUrl)
  if (transformedImage) {
    return toDataUrl(transformedImage.bytes, transformedImage.contentType)
  }

  // Some custom-domain/R2 setups do not enable Cloudflare Image Resizing.
  // Fall back only to the already allowlisted origin and resize locally before
  // embedding it, so a multi-megabyte source does not inflate the Satori SVG.
  if (transformedUrl.href === sourceUrl.href) {
    return null
  }

  const originalImage = await fetchImage(sourceUrl)
  if (!originalImage) {
    return null
  }

  const resizedImage = await sharp(Buffer.from(originalImage.bytes))
    .resize(SOCIAL_IMAGE_SIZE.width, SOCIAL_IMAGE_SIZE.height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()

  return toDataUrl(resizedImage, 'image/jpeg')
}

async function loadRepresentativeImage(
  source: string | null
): Promise<string | null> {
  'use cache: remote'

  cacheLife(publicCachePolicy.sessionDetail)

  if (!source) {
    return null
  }

  try {
    return source.startsWith('/')
      ? await readLocalImage(source)
      : await fetchRemoteImage(source)
  } catch (error) {
    logger.warn('social-image', 'Representative image could not be loaded', {
      cause: error instanceof Error ? error.message : 'unknown error',
    })
    return null
  }
}

function GdgMark() {
  return (
    <svg
      width="71"
      height="34"
      viewBox="0 0 71 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.9003 17.0543L28.285 10.4389C30.9004 8.90038 31.8234 5.51577 30.285 2.74654C28.7465 0.131162 25.3619 -0.791924 22.5927 0.746532L2.90039 12.1312L16.9003 17.0543Z"
        fill="#EA4335"
      />
      <path
        d="M25.3619 33.8232C27.3619 33.8232 29.2081 32.7463 30.1311 31.0539C31.6696 28.4386 30.7465 24.9001 28.1311 23.3616L8.43883 11.977C5.82345 10.4386 2.28499 11.3616 0.746534 13.977C-0.791932 16.5924 0.131173 20.1309 2.74655 21.6693L22.4388 33.0539C23.5157 33.6693 24.4388 33.8232 25.3619 33.8232Z"
        fill="#4285F4"
      />
      <path
        d="M44.9 33.8226C45.8231 33.8226 46.7462 33.5149 47.6692 33.0533L67.3616 21.6687L53.6693 16.5918L42.1308 23.2072C39.5154 24.7457 38.5923 28.1303 40.1308 30.8995C41.2077 32.8995 43.0539 33.8226 44.9 33.8226Z"
        fill="#FBBC04"
      />
      <path
        d="M64.5924 22.5927C66.5924 22.5927 68.4385 21.5158 69.3616 19.8235C70.9001 17.2081 69.977 13.6696 67.3616 12.1312L47.6693 0.74654C45.0539 -0.791928 41.5154 0.13116 39.977 2.74654C38.4385 5.36192 39.3616 8.90038 41.977 10.4389L61.6693 21.8235C62.5924 22.285 63.6693 22.5927 64.5924 22.5927Z"
        fill="#0F9D58"
      />
    </svg>
  )
}

function BrandedFallback() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, #0b1f3a 0%, #163c66 48%, #0f5132 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: 260,
          top: -260,
          right: -80,
          display: 'flex',
          background: '#4285F4',
          opacity: 0.42,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 380,
          height: 380,
          borderRadius: 190,
          right: 180,
          bottom: -260,
          display: 'flex',
          background: '#34A853',
          opacity: 0.38,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: 110,
          top: 170,
          right: 120,
          display: 'flex',
          background: '#F9AB00',
          opacity: 0.28,
        }}
      />
    </div>
  )
}

export async function createSocialImageResponse(
  content: SocialImageContent
): Promise<Response> {
  const [representativeImage, font] = await Promise.all([
    loadRepresentativeImage(content.representativeImage),
    pretendardBoldFont,
  ])
  const title = layoutSocialTitle(content.title, content.locale)

  const svg = await satori(
    <div
      lang={content.locale}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        color: '#fff',
        background: '#10243e',
        fontFamily: 'Pretendard',
        fontWeight: 700,
      }}
    >
      {representativeImage ? (
        // next/image is not available inside Satori; it requires a plain img.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={representativeImage}
          alt=""
          width={SOCIAL_IMAGE_SIZE.width}
          height={SOCIAL_IMAGE_SIZE.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <BrandedFallback />
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          background:
            'linear-gradient(180deg, rgba(5, 12, 24, 0.22) 0%, rgba(5, 12, 24, 0.18) 34%, rgba(5, 12, 24, 0.94) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 54,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '13px 18px',
          borderRadius: 18,
          background: 'rgba(255, 255, 255, 0.94)',
          color: '#172033',
          fontSize: 25,
          fontWeight: 700,
        }}
      >
        <GdgMark />
        <span>GDGoC Yonsei</span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 58,
          right: 58,
          bottom: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#dbeafe',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 0.2,
            marginBottom: 16,
          }}
        >
          {content.generation && <span>{content.generation}</span>}
          {content.generation && <span>·</span>}
          <span>{content.category}</span>
          {content.date && <span>·</span>}
          {content.date && <span>{content.date}</span>}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 1050,
            color: '#fff',
            fontSize: title.fontSize,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -1.4,
            textShadow: '0 3px 18px rgba(0, 0, 0, 0.42)',
          }}
        >
          {title.lines.map((line, index) => (
            <div
              key={`${index}-${line}`}
              style={{
                display: 'flex',
                width: 1050,
                height: title.fontSize * 1.08,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...SOCIAL_IMAGE_SIZE,
      fonts: [
        {
          name: 'Pretendard',
          data: font,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )

  const jpeg = await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Cache-Control':
        content.version === 'fallback'
          ? FALLBACK_SOCIAL_IMAGE_CACHE_CONTROL
          : SOCIAL_IMAGE_CACHE_CONTROL,
      'Content-Length': String(jpeg.byteLength),
      'Content-Type': SOCIAL_IMAGE_CONTENT_TYPE,
    },
  })
}
