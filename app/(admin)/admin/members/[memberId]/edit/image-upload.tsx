'use client'

import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { uploadProfileImageState } from '@/lib/atoms'
import { uploadProfileImage } from '@/lib/upload-image'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
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
  const [hasFailed, setHasFailed] = useState(false)
  const { t } = useAdminI18n()

  /**
   * 선택한 이미지 파일을 업로드하고 공개 URL 을 폼 값으로 반영하는 함수
   */
  const saveImgFile = async () => {
    const fileData = inputRef.current?.files?.[0]
    if (!fileData) return

    setIsLoading(true)
    setHasFailed(false)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(fileData)
      reader.onloadend = () => {
        setImgFileUrl(reader.result as string)
      }

      // 업로드에 성공한 뒤에만 기존 프로필 이미지를 교체한다.
      setProfileImage(await uploadProfileImage(memberId, fileData))
    } catch (error) {
      console.error(error)
      setHasFailed(true)
    } finally {
      // 프리뷰를 정리해 저장된 이미지가 다시 보이도록 되돌린다.
      setImgFileUrl('')
      setIsLoading(false)
      // 같은 파일을 다시 선택해도 onChange 가 동작하도록 리셋
      if (inputRef.current) inputRef.current.value = ''
    }
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
      {hasFailed && (
        <p role={'alert'} className={'type-caption text-danger font-semibold'}>
          {t('uploadFailed')}
        </p>
      )}
    </div>
  )
}
