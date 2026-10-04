'use client'

/**
 * 단일 이미지 업로드 입력(클라이언트 컴포넌트).
 *
 * 파일을 고르면 presigned URL로 R2에 바로 올리고(`lib/upload-image.ts`), 받은 공개 URL을
 * 숨은 필드에 넣어 폼과 함께 제출한다. 업로드 중에는 전역 atom으로 제출 버튼을 막는다.
 */
import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { useAtom } from 'jotai'
import { uploadSingleImageState } from '@/lib/admin/atoms'
import { uploadSingleImage } from '@/lib/upload-image'
import { readImagePreview } from '@/lib/read-image-preview'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 이미지 한 장을 업로드하고, 공개 URL을 숨은 필드에 실어 폼과 함께 전송한다.
 *
 * @param name 폼 필드 이름
 * @param baseUrl 업로드 API 경로(리소스별 `/api/admin/.../upload` 등)
 * @param defaultValue 기존 이미지 URL(수정 화면)
 * @param children 업로드 버튼 문구
 */
export default function DataImageInput({
  children,
  name,
  title,
  baseUrl,
  defaultValue = '',
}: {
  children?: ReactNode
  name: string
  title: string
  baseUrl: string
  defaultValue?: string | undefined
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [previewImageUrl, setPreviewImageUrl] = useState(defaultValue)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(defaultValue)
  const [isLoading, setIsLoading] = useAtom(uploadSingleImageState)
  const [hasFailed, setHasFailed] = useState(false)
  const { t } = useAdminI18n()

  /**
   * 선택한 이미지 파일을 업로드하고 공개 URL 을 폼 값으로 반영하는 함수
   */
  const uploadSelectedImage = async () => {
    const fileData = inputRef.current?.files?.[0]
    if (!fileData) return

    const previousImageUrl = uploadedImageUrl

    setIsLoading(true)
    setHasFailed(false)
    try {
      setPreviewImageUrl(await readImagePreview(fileData))
      // 저장된 이미지는 폼 저장이 성공한 뒤 서버 서비스가 정리한다.
      setUploadedImageUrl(await uploadSingleImage(baseUrl, fileData))
    } catch (error) {
      console.error(error)
      // 업로드에 실패했으면 이전 값을 유지한다.
      // 깨진 URL 이 폼에 실려 그대로 저장되는 것을 막는 지점이다.
      setPreviewImageUrl(previousImageUrl)
      setHasFailed(true)
    } finally {
      setIsLoading(false)
      // 같은 파일을 다시 선택해도 onChange 가 동작하도록 리셋
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label px-0.5'}>{title}</div>
      <input
        type={'file'}
        accept={'image/*'}
        hidden={true}
        ref={inputRef}
        // 업로드 오류는 uploadSelectedImage 안에서 처리한다.
        onChange={() => void uploadSelectedImage()}
      />
      <input
        hidden={true}
        value={uploadedImageUrl}
        readOnly={true}
        name={name}
      />
      {previewImageUrl && (
        <Image
          src={previewImageUrl}
          alt={'Project Main Image'}
          width={600}
          height={400}
          className={'notice-scale-enter w-full'}
          placeholder={'blur'}
          blurDataURL={'/default-image.png'}
        />
      )}
      <button
        type={'button'}
        onClick={() => inputRef.current?.click()}
        className={'admin-btn-primary w-fit'}
        disabled={isLoading}
      >
        {isLoading ? t('uploading') : children}
      </button>
      {hasFailed && (
        <p role={'alert'} className={'type-caption text-danger font-semibold'}>
          {t('uploadFailed')}
        </p>
      )}
    </div>
  )
}
