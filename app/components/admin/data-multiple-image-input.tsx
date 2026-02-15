'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import { ProjectContentImagePostRequest } from '@/app/api/admin/projects/content-image/route'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { uploadMultipleImagesState } from '@/lib/atoms'

/**
 * `readFilesAsDataURLs` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`files`, `FileList`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
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
 * `DataMultipleImageInput` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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

  /**
   * `deleteContentImage` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`url`, `string`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  async function deleteContentImage(targetIndex: number) {
    setPrevImageUrls((prev) => prev.filter((_, index) => index !== targetIndex))
    setImageUrls((prev) => prev.filter((_, index) => index !== targetIndex))
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
                onClick={() => deleteContentImage(index)}
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
