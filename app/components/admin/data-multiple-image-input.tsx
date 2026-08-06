'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { uploadMultipleImagesState } from '@/lib/atoms'
import { uploadMultipleImages } from '@/lib/upload-image'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 선택한 파일들을 프리뷰용 dataURL 로 읽는다. 결과 순서는 입력 순서와 같다.
 */
function readFilesAsDataURLs(files: FileList): Promise<string[]> {
  const arr = Array.from(files)
  return Promise.all(
    arr.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
    )
  )
}

/**
 * 이미지 여러 장을 업로드하고, 공개 URL 목록을 히든 필드에 실어 폼과 함께 전송한다.
 */
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
  defaultValue?: string[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [prevImageUrls, setPrevImageUrls] = useState<string[]>(defaultValue)
  const [isLoading, setIsLoading] = useAtom(uploadMultipleImagesState)
  const [imageUrls, setImageUrls] = useState<string[]>(defaultValue)
  const [hasFailed, setHasFailed] = useState(false)
  const { t } = useAdminI18n()

  /**
   * 선택한 이미지 파일 리스트를 주소 리스트로 변환하는 함수
   */
  const saveImgFile = async () => {
    const files = inputRef.current?.files
    if (!files || files.length === 0) return

    const filesArr = Array.from(files)
    let addedPreviewCount = 0

    setIsLoading(true)
    setHasFailed(false)
    try {
      // 1) 프리뷰용 dataURL을 "파일 순서대로" 모두 읽어서 한 번에 set
      const previews = await readFilesAsDataURLs(files)
      addedPreviewCount = previews.length
      setPrevImageUrls((prev) => [...prev, ...previews])

      // 2) 업로드 후 공개 URL을 입력 순서 그대로 추가
      const publicUrls = await uploadMultipleImages(baseUrl, filesArr)
      setImageUrls((prev) => [...prev, ...publicUrls])
    } catch (error) {
      console.error(error)
      // 업로드에 실패했으면 방금 추가한 프리뷰만 되돌린다.
      // 그대로 두면 저장되지 않은 이미지가 저장된 것처럼 보이고,
      // prevImageUrls 와 imageUrls 의 인덱스가 어긋나 삭제 버튼이 엉뚱한 항목을 지운다.
      if (addedPreviewCount > 0) {
        setPrevImageUrls((prev) =>
          prev.slice(0, prev.length - addedPreviewCount)
        )
      }
      setHasFailed(true)
    } finally {
      setIsLoading(false)
      // 같은 파일을 다시 선택해도 onChange가 동작하도록 리셋
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  /**
   * 프리뷰와 전송 값에서 같은 인덱스의 이미지를 함께 제거한다.
   */
  function deleteContentImage(targetIndex: number) {
    setPrevImageUrls((prev) => prev.filter((_, index) => index !== targetIndex))
    setImageUrls((prev) => prev.filter((_, index) => index !== targetIndex))
  }

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label px-0.5'}>{title}</div>
      <input
        ref={inputRef}
        type={'file'}
        accept="image/*"
        multiple={true}
        hidden={true}
        onChange={saveImgFile}
      />
      <input
        name={name}
        hidden={true}
        value={JSON.stringify(imageUrls)}
        readOnly={true}
      />
      {prevImageUrls.length > 0 && (
        <div className={'grid w-full grid-cols-1 gap-2'}>
          {prevImageUrls.map((url, index) => (
            <div key={index} className={'notice-scale-enter relative w-full'}>
              <button
                type={'button'}
                aria-label={t('delete')}
                title={t('delete')}
                className={
                  'bg-danger focus-visible:outline-primary absolute top-2 right-2 cursor-pointer rounded-md p-1.5 text-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2'
                }
                onClick={() => deleteContentImage(index)}
              >
                <TrashIcon className={'size-5'} aria-hidden={'true'} />
              </button>
              <Image
                src={url}
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
