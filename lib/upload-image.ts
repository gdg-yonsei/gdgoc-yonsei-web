/**
 * 관리자 화면의 이미지 업로드 흐름(사전 서명 URL 발급 → R2 직접 업로드)을 담당한다.
 *
 * 업로드 컴포넌트 세 개가 같은 흐름을 각자 구현하면서 응답 상태를 확인하지 않았다.
 * 그래서 권한 만료(403)나 검증 실패(400) 같은 정상적인 에러 응답이 성공으로
 * 취급됐고, `undefined`가 섞인 URL이 폼 히든 필드에 실려 그대로 DB에 저장됐다.
 * 응답 검사와 형태 확인을 이 모듈 한 곳으로 모아 호출부가 실패를 놓칠 수 없게 한다.
 */

export class ImageUploadError extends Error {
  readonly status?: number

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

function toPublicImageUrl(objectKey: string) {
  return `${process.env.NEXT_PUBLIC_IMAGE_URL}${objectKey}`
}

/**
 * 에러 응답 본문에서 표시 가능한 메시지를 뽑는다.
 * API는 실패 시 `{ error: string }` 형태로 응답한다.
 */
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

/**
 * 응답이 실제로 사전 서명 URL 형태인지 확인한다.
 * 이 확인이 없으면 예상 밖의 응답이 `undefined`로 조용히 흘러 들어간다.
 */
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

/**
 * 이미지 한 장을 업로드하고 공개 접근 URL을 반환한다.
 * @param baseUrl - 사전 서명 URL을 발급하는 API 경로
 */
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

/**
 * 사용자 프로필 이미지를 업로드하고 공개 접근 URL을 반환한다.
 */
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

/**
 * 여러 장을 업로드하고 공개 접근 URL을 입력 순서대로 반환한다.
 */
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

/**
 * 업로드된 이미지를 삭제한다.
 */
export async function deleteUploadedImage(
  baseUrl: string,
  imageUrl: string
): Promise<void> {
  let response: Response

  try {
    response = await fetch(baseUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    })
  } catch (cause) {
    throw new ImageUploadError('Could not reach the upload API', { cause })
  }

  if (!response.ok) {
    throw new ImageUploadError(await readErrorMessage(response), {
      status: response.status,
    })
  }
}
