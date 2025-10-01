'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { ProjectContentImagePostRequest } from '@/app/api/admin/projects/content-image/route'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { uploadMultipleImagesState } from '@/lib/atoms'

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

  /**
   * 선택한 이미지 파일 리스트를 주소 리스트로 변환하는 함수
   */
  const saveImgFile = async () => {
    const files = inputRef.current?.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    try {
      // 1) 프리뷰용 dataURL을 "파일 순서대로" 모두 읽어서 한 번에 set
      const previews = await readFilesAsDataURLs(files)
      setPrevImageUrls((prev) => [...prev, ...previews])

      // 2) 업로드 URL 발급
      const res = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          images: Array.from(files).map((file) => ({
            fileName: file.name,
            type: file.type,
          })),
        } as ProjectContentImagePostRequest),
      })

      const {
        uploadUrls,
      }: { uploadUrls: { fileName: string; uploadUrl: string }[] } =
        await res.json()

      // 3) 업로드 (인덱스 매핑 유지)
      const filesArr = Array.from(files)
      await Promise.all(
        filesArr.map((file, i) =>
          fetch(uploadUrls[i].uploadUrl, {
            method: 'PUT',
            body: file,
          })
        )
      )

      // 4) 최종 접근 URL도 순서대로 추가
      setImageUrls((prev) => [
        ...prev,
        ...uploadUrls.map(
          (u) => `${process.env.NEXT_PUBLIC_IMAGE_URL}${u.fileName}`
        ),
      ])
    } catch (e) {
      console.error(e)
      // 필요하면 토스트/알림 처리
    } finally {
      setIsLoading(false)
      // 같은 파일을 다시 선택해도 onChange가 동작하도록 리셋
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function deleteContentImage(url: string) {
    setPrevImageUrls((prev) => prev.filter((prevUrl) => prevUrl !== url))
    setImageUrls((imageUrl) => imageUrl.filter((u) => u !== url))
  }

  return (
    <div
      className={'col-span-1 flex flex-col gap-2 sm:col-span-3 lg:col-span-4'}
    >
      <div className={'px-1 text-sm font-semibold text-neutral-700'}>
        {title}
      </div>
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
            <div key={index} className={'relative w-full'}>
              <button
                type={'button'}
                className={
                  'absolute top-1 right-1 cursor-pointer rounded-lg bg-red-500 p-1'
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
        className={'rounded-xl bg-neutral-900 p-2 text-sm text-white'}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? 'Uploading...' : children}
      </button>
    </div>
  )
}
