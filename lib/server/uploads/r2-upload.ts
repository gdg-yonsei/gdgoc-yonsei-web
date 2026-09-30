import 'server-only'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import r2Client from '@/lib/server/r2-client'
import { getR2BucketEnv } from '@/lib/server/env'

export const PRESIGNED_UPLOAD_TTL_SECONDS = 900
const HEAD_BYTES = 32

const bucket = () => getR2BucketEnv().R2_BUCKET_NAME

/**
 * 크기와 형식을 서명에 넣은 PUT URL. 선언과 다른 크기·Content-Type 으로 올리면
 * R2 가 서명 불일치로 거절하므로 서버를 거치지 않고도 한도를 강제할 수 있다.
 */
export function presignImagePut(
  key: string,
  contentType: string,
  contentLength: number
) {
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

export function headImage(key: string) {
  return r2Client.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
}

/** 매직 바이트 검사용으로 객체 앞부분만 읽는다. */
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

export async function deleteImage(key: string) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

/**
 * 스트림을 버퍼링하지 않고 R2 멀티파트 업로드로 흘려 보낸다(10MB 파트 × 4 병렬 ≈ 40MB).
 * maxBytes 를 넘는 순간 스트림을 오류로 끝내 업로드를 중단시키고,
 * 미완성 멀티파트는 lib-storage 가 abort 한다(leavePartsOnError: false).
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
