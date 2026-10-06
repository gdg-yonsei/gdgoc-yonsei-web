// sharp·satori는 이미지 요청 시에만 불러온다. 원본 버전으로 캐시 키를 바꾼다.
import 'server-only'

import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { cacheLife } from 'next/cache'
import sharp from 'sharp'
import { layoutSocialTitle } from '@/lib/seo/social-image-title'
import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
} from '@/lib/site/bracket-geometry'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { logger } from '@/lib/server/logger'
import type { SocialImageContent } from '@/lib/seo/social-image-data'
import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from '@/lib/seo/social-image-config'

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

// Satori가 woff2를 읽지 못해 Pretendard woff 서브셋을 보관한다(라이선스: lib/seo/fonts/LICENSE.txt).
async function loadPretendardBold(): Promise<ArrayBuffer> {
  const font = await readFile(
    resolve(process.cwd(), 'lib/seo/fonts/Pretendard-Bold.subset.woff')
  )
  return font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength)
}

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

  // Image Resizing을 쓸 수 없으면 허용 목록 원본만 받아 로컬에서 축소해 Satori SVG 크기를 제한한다.
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

const STAGE = '#1e1e1e'
const STAGE_RAISED = '#2b2b2b'
const ON_STAGE = '#f0f0f0'
const ON_STAGE_MUTED = '#b4b4b4'

const SIDES = ['left', 'right'] as const

function bracketsViewBox(gap: number) {
  const width = BRACKET_VIEWBOX.width * (2 + gap)
  return { width, height: BRACKET_VIEWBOX.height }
}

function BracketsMark({ height }: { height: number }) {
  const box = bracketsViewBox(0.18)
  return (
    <svg
      width={(box.width / box.height) * height}
      height={height}
      viewBox={`0 0 ${box.width} ${box.height}`}
    >
      {SIDES.map((side, index) => (
        <g
          key={side}
          transform={`translate(${index * BRACKET_VIEWBOX.width * 1.18} 0)`}
        >
          {bracketCapsulesInViewBox(side).map((capsule) => (
            <path
              key={capsule.hue}
              d={capsulePath(capsule)}
              fill={CAPSULE_HEX[capsule.hue]}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function HalftoneBrackets() {
  const box = bracketsViewBox(0.22)
  const width = 760
  return (
    <svg
      width={width}
      height={(box.height / box.width) * width}
      viewBox={`0 0 ${box.width} ${box.height}`}
      style={{ position: 'absolute', right: -40, top: 96 }}
    >
      <defs>
        {Object.entries(CAPSULE_HEX).map(([hue, hex]) => (
          <pattern
            key={hue}
            id={`dots-${hue}`}
            width="9"
            height="9"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4.5" cy="4.5" r="3.4" fill={hex} />
          </pattern>
        ))}
      </defs>
      {SIDES.map((side, index) => (
        <g
          key={side}
          transform={`translate(${index * BRACKET_VIEWBOX.width * 1.22} 0)`}
        >
          {bracketCapsulesInViewBox(side).map((capsule) => (
            <g key={capsule.hue}>
              <path
                d={capsulePath(capsule)}
                fill={CAPSULE_HEX[capsule.hue]}
                fillOpacity={0.16}
              />
              <path
                d={capsulePath(capsule)}
                fill={`url(#dots-${capsule.hue})`}
              />
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

// Cache Components 이미지 라우트의 비캐시 IO는 500을 내므로 파일·네트워크 작업을 이 캐시에 둔다.
// JPEG 내용 캐시의 version은 원본 행이 바뀔 때 갱신된다.
async function renderSocialImageJpeg(
  content: SocialImageContent
): Promise<Uint8Array> {
  'use cache: remote'

  cacheLife(publicCachePolicy.projectDetail)

  const [representativeImage, font] = await Promise.all([
    loadRepresentativeImage(content.representativeImage),
    loadPretendardBold(),
  ])
  const title = layoutSocialTitle(content.title, content.locale)

  // Satori 초기 import의 레이아웃 엔진 IO도 캐시 안에서 실행해야 이미지 요청의 500을 피한다.
  const { default: satori } = await import('satori')
  const svg = await satori(
    <div
      lang={content.locale}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        color: ON_STAGE,
        background: STAGE,
        fontFamily: 'Pretendard',
        fontWeight: 700,
      }}
    >
      {representativeImage ? (
        // Satori 안에서는 next/image를 쓸 수 없어 일반 img를 쓴다.
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
        <HalftoneBrackets />
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          background: representativeImage
            ? 'linear-gradient(180deg, rgba(30, 30, 30, 0.12) 0%, rgba(30, 30, 30, 0.3) 38%, rgba(30, 30, 30, 0.88) 58%, rgba(30, 30, 30, 0.96) 100%)'
            : 'linear-gradient(90deg, rgba(30, 30, 30, 0.96) 0%, rgba(30, 30, 30, 0.82) 45%, rgba(30, 30, 30, 0.1) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 58,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 20px',
          borderRadius: 999,
          background: STAGE_RAISED,
          color: ON_STAGE,
          fontSize: 25,
          fontWeight: 700,
        }}
      >
        <BracketsMark height={24} />
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
            color: ON_STAGE_MUTED,
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
            color: ON_STAGE,
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

  return new Uint8Array(jpeg)
}

// 실제 콘텐츠는 버전 URL로 1년 캐시한다. 기본 카드는 새 데이터가 생길 수 있어 짧게 캐시한다.
export async function createSocialImageResponse(
  content: SocialImageContent
): Promise<Response> {
  const jpeg = await renderSocialImageJpeg(content)

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
