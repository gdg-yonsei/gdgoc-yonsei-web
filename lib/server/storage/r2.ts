/**
 * Cloudflare R2 이미지 저장소 작업 모음.
 *
 * R2 버킷을 읽고 쓰는 코드는 이 파일 하나에만 둔다. 사전 서명 URL 발급, 객체
 * 조회·삭제, 스트리밍 업로드를 모두 이 모듈이 담당한다. 호출부는 객체 키만 다루고
 * 버킷 이름이나 S3 명령 객체를 직접 만들지 않는다.
 *
 * 사용처
 * - 관리자 웹 업로드 API(`lib/server/image-upload-route.ts`, 프로필 이미지 라우트)
 * - MCP 이미지 업로드 서비스(`lib/server/services/admin/images/`)
 * - 프로젝트·세션 수정/삭제 시 더 이상 쓰지 않는 이미지 정리
 */
import 'server-only'

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2BucketEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'
import {
  normalizeR2ImageObjectKey,
  type R2ImagePrefix,
} from '@/lib/server/storage/object-key'
import { r2Client } from '@/lib/server/storage/r2-client'

/** 관리자 웹 업로드용 사전 서명 URL 유효 시간(초). 브라우저가 바로 PUT하므로 넉넉히 1시간. */
export const WEB_UPLOAD_TTL_SECONDS = 3600

/** MCP 업로드용 사전 서명 URL 유효 시간(초). 크기를 서명에 넣으므로 짧게 15분. */
export const PRESIGNED_UPLOAD_TTL_SECONDS = 900

/** 매직 바이트로 이미지 형식을 판별할 때 읽는 앞부분 길이. */
const HEAD_BYTES = 32

/** 환경변수가 없으면 호출 시점에 예외를 던지도록 버킷 이름은 매번 읽는다. */
const bucket = () => getR2BucketEnv().R2_BUCKET_NAME

/**
 * 관리자 웹 업로드용 PUT URL을 발급한다.
 * 파일 크기는 서명하지 않으며, 형식과 권한 검사는 업로드 API가 발급 전에 끝낸다.
 */
export async function presignImageUpload(
  key: string,
  contentType: string
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: WEB_UPLOAD_TTL_SECONDS }
  )
}

/**
 * 크기와 형식을 서명에 포함한 PUT URL을 발급한다(MCP 업로드용).
 * 선언과 다른 크기나 Content-Type으로 올리면 R2가 서명 불일치로 거절하므로, 서버를
 * 거치지 않고도 업로드 한도를 강제할 수 있다.
 */
export async function presignSizedImageUpload(
  key: string,
  contentType: string,
  contentLength: number
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    {
      expiresIn: PRESIGNED_UPLOAD_TTL_SECONDS,
      signableHeaders: new Set(['content-type', 'content-length']),
    }
  )
}

/** 객체 메타데이터(크기, Content-Type)를 조회한다. 객체가 없으면 S3 예외를 던진다. */
export function headImage(key: string) {
  return r2Client.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
}

/** 매직 바이트 검사용으로 객체의 앞부분만 Range 요청으로 읽는다. */
export async function readImageHead(key: string): Promise<Uint8Array> {
  const object = await r2Client.send(
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      Range: `bytes=0-${HEAD_BYTES - 1}`,
    })
  )
  return object.Body
    ? new Uint8Array(await object.Body.transformToByteArray())
    : new Uint8Array()
}

/** 객체 하나를 삭제한다. 실패하면 예외를 그대로 던진다. */
export async function deleteImage(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

/**
 * 여러 객체를 한 번의 요청으로 삭제한다.
 *
 * 리소스 삭제 후 이미지 정리처럼 "실패해도 본 작업은 성공으로 끝나야 하는" 곳에서
 * 쓰므로 예외를 던지지 않고 결과를 boolean으로 돌려준다. `true`는 요청이 처리됐다는
 * 뜻일 뿐, 모든 객체가 지워졌다는 보장은 아니다.
 */
export async function deleteImages(keys: readonly string[]): Promise<boolean> {
  if (keys.length === 0) {
    return true
  }

  try {
    await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: keys.map((key) => ({ Key: key })) },
      })
    )
    return true
  } catch (error) {
    logger.error('r2.delete-images', error, { imageKeyCount: keys.length })
    return false
  }
}

/**
 * 수정 전후 이미지 목록을 비교해, 더 이상 참조하지 않는 이미지를 R2에서 지운다.
 *
 * 우리 버킷의 해당 접두사(`projects/`, `sessions/`) 객체만 대상으로 하며, 외부 URL이나
 * 기본 이미지는 키 정규화 단계에서 걸러진다. 삭제 실패는 예외로 전파되어 호출한
 * 서비스가 오류 응답을 만든다.
 */
export async function deleteRemovedImages({
  previousImages,
  nextImages,
  previousMainImage,
  nextMainImage,
  prefix,
}: {
  previousImages: readonly string[]
  nextImages: readonly string[]
  previousMainImage?: string | null
  nextMainImage?: string | null
  prefix: Extract<R2ImagePrefix, 'projects' | 'sessions'>
}): Promise<void> {
  const nextImageSet = new Set(nextImages)
  const removedImages = previousImages.filter(
    (image) => !nextImageSet.has(image)
  )

  if (previousMainImage && previousMainImage !== nextMainImage) {
    removedImages.push(previousMainImage)
  }

  const imageKeys = removedImages
    .map((imageUrl) => normalizeR2ImageObjectKey(imageUrl, prefix))
    .filter((imageKey): imageKey is string => Boolean(imageKey))

  await Promise.all(imageKeys.map((imageKey) => deleteImage(imageKey)))
}

/**
 * 스트림을 버퍼링하지 않고 R2 멀티파트 업로드로 흘려 보낸다(10MB 파트 × 4 병렬 ≈ 40MB).
 *
 * `maxBytes`를 넘는 순간 스트림을 오류로 끝내 업로드를 중단시키고, 미완성 멀티파트는
 * lib-storage가 abort한다(`leavePartsOnError: false`). 형식 검사를 위해 앞부분
 * `HEAD_BYTES`도 함께 돌려준다.
 */
export async function streamImageToR2(
  key: string,
  body: ReadableStream<Uint8Array>,
  contentType: string,
  maxBytes: number
): Promise<{ sizeBytes: number; head: Uint8Array }> {
  let total = 0
  const head = new Uint8Array(HEAD_BYTES)
  let headLength = 0

  const limited = body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        total += chunk.byteLength
        if (headLength < HEAD_BYTES) {
          const take = chunk.subarray(0, HEAD_BYTES - headLength)
          head.set(take, headLength)
          headLength += take.byteLength
        }
        if (total > maxBytes) {
          controller.error(new Error('TOO_LARGE'))
          return
        }
        controller.enqueue(chunk)
      },
    })
  )

  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: bucket(),
      Key: key,
      Body: limited,
      ContentType: contentType,
    },
    partSize: 10 * 1024 * 1024,
    queueSize: 4,
    leavePartsOnError: false,
  })
  await upload.done()

  return { sizeBytes: total, head: head.slice(0, headLength) }
}
