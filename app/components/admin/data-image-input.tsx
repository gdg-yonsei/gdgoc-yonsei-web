'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { ProjectContentImagePostRequest } from '@/app/api/admin/projects/content-image/route'

export default function DataImageInput({
  children,
  name,
  title,
}: {
  children?: ReactNode
  name: string
  title: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')

  /**
   * 선택한 이미지 파일을 주소로 변환하는 함수
   */
  const saveImgFile = async () => {
    const fileData = inputRef?.current?.files?.[0]
    if (fileData) {
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string)
      }
      if (uploadedImageUrl) {
        await fetch('/api/admin/projects/content-image', {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl: uploadedImageUrl }),
        })
      }
      // upload new image
      const requestUploadUrl = await fetch(
        '/api/admin/projects/content-image',
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: fileData.name,
            type: fileData.type,
          } as ProjectContentImagePostRequest),
        }
      )
      const { uploadUrl, fileName } = await requestUploadUrl.json()
      await fetch(uploadUrl, {
        method: 'PUT',
        body: fileData,
      })
      setUploadedImageUrl(fileName)
    }
  }

  return (
    <div className={'col-span-2 flex flex-col gap-2'}>
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
          width={400}
          height={400}
          className={'w-full'}
        />
      )}
      <button
        type={'button'}
        onClick={() => inputRef.current?.click()}
        className={'p-2 rounded-xl px-3 text-white bg-neutral-900 text-sm'}
      >
        {children}
      </button>
    </div>
  )
}
