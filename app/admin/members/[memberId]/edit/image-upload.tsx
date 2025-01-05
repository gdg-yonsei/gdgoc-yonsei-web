'use client'

import { useRef, useState } from 'react'
import UserProfileImage from '@/app/components/user-profile-image'

export default function ImageUpload({ image }: { image: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imgFile, setImgFile] = useState(image)

  const saveImgFile = () => {
    const file = inputRef?.current?.files?.[0] as File
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setImgFile(reader.result as string)
    }
  }

  return (
    <div className={'flex gap-2 items-center justify-start'}>
      <input
        hidden={true}
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={saveImgFile}
      />
      <UserProfileImage
        src={imgFile}
        alt={'User Profile Image'}
        width={160}
        height={160}
        className={'size-40 rounded-xl'}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className={'p-2 px-4 rounded-xl bg-neutral-800 text-white'}
      >
        Upload Profile Image
      </button>
    </div>
  )
}
