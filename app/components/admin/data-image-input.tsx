'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { useAtom } from 'jotai'
import { uploadSingleImageState } from '@/lib/atoms'
import { ProjectMainImagePostRequest } from '@/app/api/admin/projects/main-image/route'

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
      className={'col-span-1 flex flex-col gap-2 sm:col-span-3 lg:col-span-4'}
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
        {isLoading ? 'Uploading...' : children}
      </button>
    </div>
  )
}
