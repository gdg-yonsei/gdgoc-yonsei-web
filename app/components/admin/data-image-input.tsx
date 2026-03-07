'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { useAtom } from 'jotai'
import { uploadSingleImageState } from '@/lib/atoms'
import { ProjectMainImagePostRequest } from '@/app/api/admin/projects/main-image/route'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * `DataImageInput` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
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
  defaultValue?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [previewImageUrl, setPreviewImageUrl] = useState(defaultValue)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(defaultValue)
  const [isLoading, setIsLoading] = useAtom(uploadSingleImageState)
  const { t } = useAdminI18n()

  /**
   * 선택한 이미지 파일을 주소로 변환하는 함수
   */
  const saveImgFile = async () => {
    const fileData = inputRef?.current?.files?.[0]
    if (fileData) {
      setIsLoading(true)
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string)
      }
      if (uploadedImageUrl.includes('https')) {
        await fetch(baseUrl, {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl: uploadedImageUrl }),
        })
      }
      // upload new image
      const requestUploadUrl = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          fileName: fileData.name,
          type: fileData.type,
        } as ProjectMainImagePostRequest),
      })
      const { uploadUrl, fileName } = await requestUploadUrl.json()
      await fetch(uploadUrl, {
        method: 'PUT',
        body: fileData,
      })
      setUploadedImageUrl(process.env.NEXT_PUBLIC_IMAGE_URL + fileName)
      setIsLoading(false)
    }
  }

  return (
    <div
      className={'col-span-1 flex flex-col gap-2 sm:col-span-2 lg:col-span-3'}
    >
      <div className={'px-1 text-sm font-semibold text-neutral-700'}>
        {title}
      </div>
      <input
        type={'file'}
        accept={'image'}
        hidden={true}
        ref={inputRef}
        onChange={saveImgFile}
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
          className={'w-full'}
          placeholder={'blur'}
          blurDataURL={'/default-image.png'}
        />
      )}
      <button
        type={'button'}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl p-2 px-3 text-sm text-white ${isLoading ? 'bg-neutral-800' : 'bg-neutral-900'} transition-all`}
        disabled={isLoading}
      >
        {isLoading ? t('uploading') : children}
      </button>
    </div>
  )
}
