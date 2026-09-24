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

async function loadPretendardBold(): Promise<ArrayBuffer> {
  const font = await readFile(
    resolve(
      process.cwd(),
      'node_modules/pretendard/dist/web/static/woff-subset/Pretendard-Bold.subset.woff'
    )
  )
  return font.buffer.slice(
    font.byteOffset,
    font.byteOffset + font.byteLength
  ) as ArrayBuffer
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

const STAGE = '#1e1e1e'
const STAGE_RAISED = '#2b2b2b'
const ON_STAGE = '#f0f0f0'
const ON_STAGE_MUTED = '#b4b4b4'

const SIDES = ['left', 'right'] as const

/** Both GDG brackets side by side, `gap` bracket-widths apart. */
function bracketsViewBox(gap: number) {
  const width = BRACKET_VIEWBOX.width * (2 + gap)
  return { width, height: BRACKET_VIEWBOX.height }
}

/** The solid `< >` mark for the chip. */
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

/** Cards without a photo: the halftone brackets, as the hero draws them. */
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

/*
 * Everything that touches the file system or the network runs inside this
 * cache scope: under Cache Components an image route that awaits uncached IO
 * fails with "used IO that was not cached" (HTTP 500). The JPEG is keyed by
 * the content, whose `version` changes whenever the source row does.
 */
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

  // Satori fetches its layout engine when first imported. Importing it here
  // keeps that fetch inside this cache scope; imported from a prerendering
  // route it is uncached IO that never settles, and the image request 500s.
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
