'use client'

import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { uploadProfileImageState } from '@/lib/atoms'
import { PostBody } from '@/app/api/admin/members/profile-image/route'
import UserProfileImagePreview from '@/app/components/user-profile-image-preview'
import SelectImageButton from '@/app/(admin)/admin/members/[memberId]/edit/select-image-button'

/**
 * 이미지 업로드 컴포넌트
 * @param image - 사용자 기존 프로필 이미지 URL
 * @param memberId - 멤버 ID
 * @param name - input name
 * @constructor
 */
export default function ImageUpload({
  image,
  memberId,
  name,
}: {
  image: string | null
  memberId: string
  name: string
}) {
  // input 태그 ref
  const inputRef = useRef<HTMLInputElement>(null)
  // 선택된 이미지 파일 링크
  const [imgFileUrl, setImgFileUrl] = useState('')
  // 로딩 상태
  const [isLoading, setIsLoading] = useAtom(uploadProfileImageState)
  // 사용자 기존 프로필 이미지 URL
  const [profileImage, setProfileImage] = useState(image)

  /**
   * 선택한 이미지 파일을 주소로 변환하는 함수
   */
  const saveImgFile = async () => {
    // 로딩 상태 변환
    setIsLoading(true)
    const fileData = inputRef?.current?.files?.[0]

    if (fileData) {
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setImgFileUrl(reader.result as string)
      }
      // 이미지 파일을 업로드 할 URL 요청
      const requestUploadUrl = await fetch('/api/admin/members/profile-image', {
        method: 'POST',
        body: JSON.stringify({
          type: inputRef?.current?.files?.[0].type,
          fileName: inputRef?.current?.files?.[0].name,
          memberId: memberId,
        } as PostBody),
      })
      // 이미지 파일 업로드 URL 및 난수로 생성된 파일 이름
      const uploadUrl = (await requestUploadUrl.json()) as {
        uploadUrl: string
        fileName: string
      }

      // 이미지 업로드 요청
      await fetch(uploadUrl.uploadUrl, {
        method: 'PUT',
        body: inputRef?.current?.files?.[0],
      })

      // 기존 프로필 이미지 변경
      setProfileImage(uploadUrl.fileName)
      // 이미지 파일 경로 초기화
      setImgFileUrl('')
    }

    // 로딩 상태 변경
    setIsLoading(false)
  }

  return (
    <div className={'flex flex-col items-start gap-2'}>
      <input
        hidden={true}
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={saveImgFile}
      />
      <input
        hidden={true}
        name={name}
        value={profileImage ? profileImage : ''}
        readOnly={true}
      />
      <UserProfileImagePreview
        src={imgFileUrl ? imgFileUrl : profileImage}
        alt={'User Profile Image'}
        width={160}
        height={160}
        className={'mx-auto aspect-square rounded-full'}
      />
      <SelectImageButton
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      />
    </div>
  )
}
