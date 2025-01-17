'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'

export default function DataMultipleImageInput({
  children,
  name,
  title,
}: {
  children?: ReactNode
  name: string
  title: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [imgFileUrl, setImgFileUrl] = useState<string[]>([])

  /**
   * 선택한 이미지 파일 리스트를 주소 리스트로 변환하는 함수
   */
  const saveImgFile = () => {
    const fileData = inputRef?.current?.files
    if (fileData) {
      for (let i = 0; i < fileData.length; i++) {
        const reader = new FileReader()
        reader.readAsDataURL(fileData[i])
        reader.onloadend = () => {
          setImgFileUrl((prev) => [...prev, reader.result as string])
        }
      }
    }
  }

  return (
    <div className={'col-span-4 flex flex-col gap-2'}>
      <div className={'text-sm font-semibold text-neutral-700 px-1'}>
        {title}
      </div>
      <input
        ref={inputRef}
        type={'file'}
        accept={'image'}
        multiple={true}
        hidden={true}
        name={name}
        onChange={saveImgFile}
      />
      <div className={'grid grid-cols-4 gap-2 w-full'}>
        {imgFileUrl.map((url, index) => (
          <Image
            key={index}
            src={url}
            alt={'Project Main Image'}
            width={400}
            height={400}
          />
        ))}
      </div>
      <button
        type={'button'}
        className={'p-2 rounded-xl bg-neutral-900 text-white text-sm'}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </button>
    </div>
  )
}
