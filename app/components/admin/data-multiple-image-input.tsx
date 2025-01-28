'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { isLoadingState } from '@/lib/atoms'
import { useAtom } from 'jotai'
import { ProjectContentImagePostRequest } from '@/app/api/admin/projects/content-image/route'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function DataMultipleImageInput({
  children,
  name,
  title,
  defaultValue = [],
}: {
  children?: ReactNode
  name: string
  title: string
  defaultValue?: string[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [prevImageUrls, setPrevImageUrls] = useState<string[]>(defaultValue)
  const [, setGlobalLoading] = useAtom(isLoadingState)
  const [localLoading, setLocalLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(defaultValue)

  /**
   * 선택한 이미지 파일 리스트를 주소 리스트로 변환하는 함수
   */
  const saveImgFile = async () => {
    const fileData = inputRef?.current?.files
    if (fileData) {
      setGlobalLoading(true)
      setLocalLoading(true)
      for (let i = 0; i < fileData.length; i++) {
        const reader = new FileReader()
        reader.readAsDataURL(fileData[i])
        reader.onloadend = () => {
          setPrevImageUrls((prev) => [...prev, reader.result as string])
        }
      }
      const requestUploadUrl = await fetch(
        '/api/admin/projects/content-image',
        {
          method: 'POST',
          body: JSON.stringify({
            images: Array.from(fileData).map((file) => ({
              fileName: file.name,
              type: file.type,
            })),
          } as ProjectContentImagePostRequest),
        }
      )
      const uploadUrls = (await requestUploadUrl.json()) as {
        uploadUrls: { fileName: string; uploadUrl: string }[]
      }
      const uploadPromise = []
      for (let i = 0; i < fileData.length; i++) {
        uploadPromise.push(
          fetch(uploadUrls.uploadUrls[i].uploadUrl, {
            method: 'PUT',
            body: fileData[i],
          })
        )
      }

      await Promise.all(uploadPromise)
      setImageUrls((prev) => [
        ...prev,
        ...uploadUrls.uploadUrls.map(
          (url) => process.env.NEXT_PUBLIC_IMAGE_URL + url.fileName
        ),
      ])

      setGlobalLoading(false)
      setLocalLoading(false)
    }
  }

  async function deleteContentImage(url: string) {
    setPrevImageUrls((prev) => prev.filter((prevUrl) => prevUrl !== url))
    setImageUrls((imageUrl) => imageUrl.filter((u) => u !== url))
  }

  return (
    <div
      className={'col-span-1 sm:col-span-3 lg:col-span-4 flex flex-col gap-2'}
    >
      <div className={'text-sm font-semibold text-neutral-700 px-1'}>
        {title}
      </div>
      <input
        ref={inputRef}
        type={'file'}
        accept={'image'}
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
        <div className={'grid grid-cols-1 gap-2 w-full'}>
          {prevImageUrls.map((url, index) => (
            <div key={index} className={'w-full relative'}>
              <button
                type={'button'}
                className={
                  'absolute top-1 right-1 cursor-pointer p-1 bg-red-500 rounded-lg'
                }
                onClick={() => deleteContentImage(url)}
              >
                <TrashIcon className={'size-6 text-white'} />
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
        className={'p-2 rounded-xl bg-neutral-900 text-white text-sm'}
        onClick={() => inputRef.current?.click()}
        disabled={localLoading}
      >
        {localLoading ? 'Uploading...' : children}
      </button>
    </div>
  )
}
