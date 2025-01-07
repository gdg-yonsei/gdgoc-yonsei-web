'use client'

import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/atoms'
import { PostBody } from '@/app/api/admin/members/profile-image/route'
import SelectImageButton from '@/app/admin/members/[memberId]/edit/select-image-button'
import SaveImageButton from '@/app/admin/members/[memberId]/edit/save-image-button'
import UserProfileImagePreview from '@/app/components/user-profile-image-preview'

export default function ImageUpload({
  image,
  memberId,
}: {
  image: string | null
  memberId: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imgFileUrl, setImgFileUrl] = useState('')
  const [file, setFile] = useState<File>()
  const [isLoading, setIsLoading] = useAtom(isLoadingState)
  const [profileImage, setProfileImage] = useState(image)

  const saveImgFile = () => {
    const fileData = inputRef?.current?.files?.[0]
    setFile(fileData)
    if (fileData) {
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setImgFileUrl(reader.result as string)
      }
    }
  }

  async function handleSaveImage() {
    setIsLoading(true)
    if (!file) {
      alert('Please select an image to upload')
      setIsLoading(false)
      return
    }
    const requestUploadUrl = await fetch('/api/admin/members/profile-image', {
      method: 'POST',
      body: JSON.stringify({
        type: inputRef?.current?.files?.[0].type,
        fileName: inputRef?.current?.files?.[0].name,
        memberId: memberId,
      } as PostBody),
    })
    const uploadUrl = (await requestUploadUrl.json()) as {
      uploadUrl: string
      fileName: string
    }

    await fetch(uploadUrl.uploadUrl, {
      method: 'PUT',
      body: inputRef?.current?.files?.[0],
    })
    await fetch(`/api/admin/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({
        profileImage: uploadUrl.fileName,
      }),
    })
    setIsLoading(false)
    setProfileImage(uploadUrl.fileName)
    setImgFileUrl('')
  }

  return (
    <div
      className={'flex flex-col sm:flex-row gap-2 items-center justify-start'}
    >
      <input
        hidden={true}
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={saveImgFile}
      />
      <UserProfileImagePreview
        src={imgFileUrl ? imgFileUrl : profileImage}
        alt={'User Profile Image'}
        width={160}
        height={160}
        className={'size-40 rounded-xl'}
      />
      <SelectImageButton
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      />
      <SaveImageButton
        isLoading={isLoading}
        imgFile={imgFileUrl}
        onClick={handleSaveImage}
      />
    </div>
  )
}
