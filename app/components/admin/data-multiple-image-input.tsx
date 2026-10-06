'use client'

/** 미리보기·공개 URL을 같은 항목으로 관리해 업로드 중 삭제도 같은 이미지를 가리킨다. */
import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { uploadMultipleImagesState } from '@/lib/admin/atoms'
import { uploadMultipleImages } from '@/lib/upload-image'
import { readImagePreview } from '@/lib/read-image-preview'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

type ImageEntry = {
  id: number
  previewUrl: string
  publicUrl: string | null
}

/** 업로드 URL 목록은 숨은 필드에 JSON으로 제출한다. */
export default function DataMultipleImageInput({
  children,
  name,
  title,
  baseUrl,
  defaultValue = [],
}: {
  children?: ReactNode
  name: string
  title: string
  baseUrl: string
  defaultValue?: string[] | undefined
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const nextImageId = useRef(defaultValue.length)
  const [images, setImages] = useState<ImageEntry[]>(() =>
    defaultValue.map((url, id) => ({ id, previewUrl: url, publicUrl: url }))
  )
  const [isLoading, setIsLoading] = useAtom(uploadMultipleImagesState)
  const [hasFailed, setHasFailed] = useState(false)
  const { t } = useAdminI18n()

  const uploadSelectedImages = async () => {
    const files = inputRef.current?.files
    if (!files || files.length === 0) return

    const selectedFiles = Array.from(files)
    const ids = selectedFiles.map(() => nextImageId.current++)
    const batchIds = new Set(ids)

    setIsLoading(true)
    setHasFailed(false)
    try {
      const previews = await Promise.all(selectedFiles.map(readImagePreview))
      setImages((current) => [
        ...current,
        ...previews.map((previewUrl, index) => ({
          id: ids[index]!,
          previewUrl,
          publicUrl: null,
        })),
      ])

      const publicUrls = await uploadMultipleImages(baseUrl, selectedFiles)
      const uploaded = new Map(ids.map((id, index) => [id, publicUrls[index]!]))
      // 업로드 중 삭제된 항목은 다시 추가하지 않는다.
      setImages((current) =>
        current.map((image) =>
          uploaded.has(image.id)
            ? { ...image, publicUrl: uploaded.get(image.id)! }
            : image
        )
      )
    } catch (error) {
      console.error(error)
      setImages((current) => current.filter((image) => !batchIds.has(image.id)))
      setHasFailed(true)
    } finally {
      setIsLoading(false)
      // 같은 파일을 다시 선택해도 onChange가 동작하도록 리셋
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const imageUrls = images.flatMap((image) =>
    image.publicUrl ? [image.publicUrl] : []
  )

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label px-0.5'}>{title}</div>
      <input
        ref={inputRef}
        type={'file'}
        accept="image/*"
        multiple={true}
        hidden={true}

        onChange={() => void uploadSelectedImages()}
      />
      <input
        name={name}
        hidden={true}
        value={JSON.stringify(imageUrls)}
        readOnly={true}
      />
      {images.length > 0 && (
        <div className={'grid w-full grid-cols-1 gap-2'}>
          {images.map((image) => (
            <div
              key={image.id}
              className={'notice-scale-enter relative w-full'}
            >
              <button
                type={'button'}
                aria-label={t('delete')}
                title={t('delete')}
                className={
                  'bg-danger text-on-danger focus-visible:outline-primary absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2'
                }
                onClick={() =>
                  setImages((current) =>
                    current.filter((entry) => entry.id !== image.id)
                  )
                }
              >
                <TrashIcon className={'size-5'} aria-hidden={'true'} />
              </button>
              <Image
                src={image.previewUrl}
                alt={'Project Main Image'}
                width={600}
                height={400}
                className={'w-full'}
                placeholder={'blur'}
                blurDataURL={'/default-image.png'}
              />
            </div>
          ))}
        </div>
      )}
      <button
        type={'button'}
        className={'admin-btn-primary w-fit'}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        aria-busy={isLoading}
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
