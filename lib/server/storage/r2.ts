// 호출부는 객체 키만 다룬다. 버킷 이름·S3 명령을 만드는 R2 접근은 이 모듈에 둔다.
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

/** 사전 서명 업로드 URL 유효 시간(초). 웹과 MCP 모두 크기·형식을 서명에 넣고 15분만 연다. */
export const PRESIGNED_UPLOAD_TTL_SECONDS = 900

const HEAD_BYTES = 32

const bucket = () => getR2BucketEnv().R2_BUCKET_NAME

// PUT URL은 크기·Content-Type을 서명해 서버를 거치지 않는 업로드도 R2가 선언대로 제한한다.
// Content-Type을 서명하지 않으면 업로더가 text/html 같은 형식으로 올려 이미지 도메인에서
// 스크립트를 실행시킬 수 있으므로, 서명하지 않는 발급 함수는 두지 않는다.
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

export async function deleteImage(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

// 삭제 요청 실패는 예외 대신 false다. true는 요청 처리만 뜻하며 모든 객체 삭제를 보장하지 않는다.
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

// 미참조 이미지 삭제는 우리 버킷의 해당 접두사만 대상으로 한다. 외부 URL·기본 이미지는 제외한다.
// 다른 행이 아직 쓰는 객체는 지우지 않는다. 남의 이미지 URL을 자기 항목에 넣었다가 빼는
// 방법으로 그 이미지를 지울 수 없게 하기 위해서다. 실패는 호출 서비스로 전달한다.
export async function deleteRemovedImages({
  previousImages,
  nextImages,
  previousMainImage,
  nextMainImage,
  prefix,
  findReferencedKeys,
}: {
  previousImages: readonly string[]
  nextImages: readonly string[]
  previousMainImage?: string | null
  nextMainImage?: string | null
  prefix: Extract<R2ImagePrefix, 'projects' | 'sessions'>
  /** DB 커밋 뒤에도 어떤 행이 참조하는 키를 돌려준다(storage/image-references.ts). */
  findReferencedKeys: (keys: readonly string[]) => Promise<ReadonlySet<string>>
}): Promise<void> {
  const nextImageSet = new Set(nextImages)
  const removedImages = previousImages.filter(
    (image) => !nextImageSet.has(image)
  )

  if (previousMainImage && previousMainImage !== nextMainImage) {
    removedImages.push(previousMainImage)
  }

  const imageKeys = [
    ...new Set(
      removedImages
        .map((imageUrl) => normalizeR2ImageObjectKey(imageUrl, prefix))
        .filter((imageKey): imageKey is string => Boolean(imageKey))
    ),
  ]
  if (imageKeys.length === 0) return

  const referencedKeys = await findReferencedKeys(imageKeys)
  await Promise.all(
    imageKeys
      .filter((imageKey) => !referencedKeys.has(imageKey))
      .map((imageKey) => deleteImage(imageKey))
  )
}

// 10MB 파트 4개 병렬(약 40MB)로 스트리밍한다. maxBytes 초과 시 abort하고 미완성 멀티파트도 정리한다.
// 매직 바이트 검사에 쓸 HEAD_BYTES를 함께 반환한다.
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
