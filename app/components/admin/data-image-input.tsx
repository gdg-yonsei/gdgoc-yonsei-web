'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/atoms'
import { ProjectMainImagePostRequest } from '@/app/api/admin/projects/main-image/route'

export default function DataImageInput({
  children,
  name,
  title,
  defaultValue = '',
}: {
  children?: ReactNode
  name: string
  title: string
  defaultValue?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [previewImageUrl, setPreviewImageUrl] = useState(defaultValue)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(defaultValue)
  const [, setGlobalLoading] = useAtom(isLoadingState)
  const [localLoading, setLocalLoading] = useState(false)

  /**
   * 선택한 이미지 파일을 주소로 변환하는 함수
   */
  const saveImgFile = async () => {
    const fileData = inputRef?.current?.files?.[0]
    if (fileData) {
      setGlobalLoading(true)
      setLocalLoading(true)
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string)
      }
      if (uploadedImageUrl) {
        await fetch('/api/admin/projects/main-image', {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl: uploadedImageUrl }),
        })
      }
      // upload new image
      const requestUploadUrl = await fetch('/api/admin/projects/main-image', {
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
      setGlobalLoading(false)
      setLocalLoading(false)
    }
  }

  return (
    <div
      className={'col-span-1 sm:col-span-3 lg:col-span-4 flex flex-col gap-2'}
    >
      <div className={'text-sm font-semibold text-neutral-700 px-1'}>
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
        className={`p-2 rounded-xl px-3 text-white  text-sm ${localLoading ? 'bg-neutral-800' : 'bg-neutral-900'} transition-all`}
        disabled={localLoading}
      >
        {localLoading ? 'Uploading...' : children}
      </button>
    </div>
  )
}
