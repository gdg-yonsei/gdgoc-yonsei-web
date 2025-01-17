'use client'

import { ReactNode, useRef, useState } from 'react'
import Image from 'next/image'

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

  const [imgFileUrl, setImgFileUrl] = useState('')

  /**
   * 선택한 이미지 파일을 주소로 변환하는 함수
   */
  const saveImgFile = () => {
    const fileData = inputRef?.current?.files?.[0]
    if (fileData) {
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setImgFileUrl(reader.result as string)
      }
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
        name={name}
      />
      {imgFileUrl && (
        <Image
          src={imgFileUrl}
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
