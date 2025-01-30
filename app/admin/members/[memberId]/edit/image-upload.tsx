'use client'

import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { uploadProfileImageState } from '@/lib/atoms'
import { PostBody } from '@/app/api/admin/members/profile-image/route'
import SelectImageButton from '@/app/admin/members/[memberId]/edit/select-image-button'
import SaveImageButton from '@/app/admin/members/[memberId]/edit/save-image-button'
import UserProfileImagePreview from '@/app/components/user-profile-image-preview'

/**
 * 이미지 업로드 컴포넌트
 * @param image - 사용자 기존 프로필 이미지 URL
 * @param memberId - 멤버 ID
 * @constructor
 */
export default function ImageUpload({
  image,
  memberId,
}: {
  image: string | null
  memberId: string
}) {
  // input 태그 ref
  const inputRef = useRef<HTMLInputElement>(null)
  // 선택된 이미지 파일 링크
  const [imgFileUrl, setImgFileUrl] = useState('')
  // input 태그에 선택된 파일
  const [file, setFile] = useState<File>()
  // 로딩 상태
  const [isLoading, setIsLoading] = useAtom(uploadProfileImageState)
  // 사용자 기존 프로필 이미지 URL
  const [profileImage, setProfileImage] = useState(image)

  /**
   * 선택한 이미지 파일을 주소로 변환하는 함수
   */
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

  /**
   * 이미지를 업로드 하는 함수
   */
  async function handleSaveImage() {
    // 로딩 상태 변환
    setIsLoading(true)
    // 선택된 파일이 없을 경우 알림 및 종료
    if (!file) {
      alert('Please select an image to upload')
      setIsLoading(false)
      return
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
    // 멤버 프로필 이미지 업데이트 요청
    await fetch(`/api/admin/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({
        profileImage: uploadUrl.fileName,
      }),
    })
    // 기존 프로필 이미지 변경
    setProfileImage(uploadUrl.fileName)
    // 이미지 파일 경로 초기화
    setImgFileUrl('')
    // 로딩 상태 변경
    setIsLoading(false)
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
