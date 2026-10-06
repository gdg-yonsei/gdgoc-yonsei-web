// 업로드 응답 상태·모양을 검증해 403·400 오류나 잘못된 URL을 폼에 성공값으로 넘기지 않는다.
import { toPublicImageUrl } from '@/lib/image-url'

/** 업로드 실패. `status`가 있으면 업로드 API가 돌려준 HTTP 상태다. */
export class ImageUploadError extends Error {
  readonly status: number | undefined

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause ? { cause: options.cause } : undefined)
    this.name = 'ImageUploadError'
    this.status = options?.status
  }
}

interface PresignedUpload {
  uploadUrl: string
  fileName: string
}

// 업로드 API 실패 본문은 { error: string } 형태다.
async function readErrorMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null)

  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error
  }

  return `Upload API responded with ${response.status}`
}

// 예상 밖의 응답이 undefined URL로 조용히 넘어가지 않도록 사전 서명 응답을 검증한다.
function assertPresignedUpload(value: unknown): PresignedUpload {
  if (
    typeof value === 'object' &&
    value !== null &&
    'uploadUrl' in value &&
    'fileName' in value &&
    typeof value.uploadUrl === 'string' &&
    typeof value.fileName === 'string'
  ) {
    return { uploadUrl: value.uploadUrl, fileName: value.fileName }
  }

  throw new ImageUploadError('Upload API returned an unexpected response')
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (cause) {
    throw new ImageUploadError('Could not reach the upload API', { cause })
  }

  if (!response.ok) {
    throw new ImageUploadError(await readErrorMessage(response), {
      status: response.status,
    })
  }

  return response.json()
}

async function putFile(uploadUrl: string, file: File) {
  let response: Response

  try {
    response = await fetch(uploadUrl, { method: 'PUT', body: file })
  } catch (cause) {
    throw new ImageUploadError('Could not reach the storage endpoint', {
      cause,
    })
  }

  if (!response.ok) {
    throw new ImageUploadError('Failed to store the uploaded image', {
      status: response.status,
    })
  }
}

// baseUrl은 사전 서명 URL을 발급하는 API 경로다.
export async function uploadSingleImage(
  baseUrl: string,
  file: File
): Promise<string> {
  const { uploadUrl, fileName } = assertPresignedUpload(
    await postJson(baseUrl, { fileName: file.name, type: file.type })
  )

  await putFile(uploadUrl, file)

  return toPublicImageUrl(fileName)
}

export async function uploadProfileImage(
  memberId: string,
  file: File
): Promise<string> {
  const { uploadUrl, fileName } = assertPresignedUpload(
    await postJson('/api/admin/members/profile-image', {
      memberId,
      fileName: file.name,
      type: file.type,
    })
  )

  await putFile(uploadUrl, file)

  return toPublicImageUrl(fileName)
}

// 여러 이미지의 공개 URL은 입력 순서대로 반환한다.
export async function uploadMultipleImages(
  baseUrl: string,
  files: readonly File[]
): Promise<string[]> {
  const body: unknown = await postJson(baseUrl, {
    images: files.map((file) => ({ fileName: file.name, type: file.type })),
  })

  const uploads =
    typeof body === 'object' && body !== null && 'uploadUrls' in body
      ? body.uploadUrls
      : null

  if (!Array.isArray(uploads) || uploads.length !== files.length) {
    throw new ImageUploadError(
      'Upload API did not return a URL for every image'
    )
  }

  const presignedUploads = uploads.map(assertPresignedUpload)

  await Promise.all(
    files.map((file, index) =>
      putFile(presignedUploads[index]!.uploadUrl, file)
    )
  )

  return presignedUploads.map((upload) => toPublicImageUrl(upload.fileName))
}
