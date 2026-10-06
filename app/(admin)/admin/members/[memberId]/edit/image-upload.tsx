'use client'

/** 이미지 선택 즉시 R2·DB를 갱신하며 폼 제출과 별개다. 숨은 필드에 저장된 키를 유지한다. */
import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { uploadProfileImageState } from '@/lib/admin/atoms'
import { uploadProfileImage } from '@/lib/upload-image'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import UserProfileImagePreview from '@/app/components/admin/user-profile-image-preview'
import SelectImageButton from '@/app/(admin)/admin/members/[memberId]/edit/select-image-button'

export default function ImageUpload({
  image,
  memberId,
  name,
}: {
  image: string | null
  memberId: string
  name: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imgFileUrl, setImgFileUrl] = useState('')
  const [isLoading, setIsLoading] = useAtom(uploadProfileImageState)
  const [profileImage, setProfileImage] = useState(image)
  const [hasFailed, setHasFailed] = useState(false)
  const { t } = useAdminI18n()

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
      setImgFileUrl('')
      setIsLoading(false)
      // 같은 파일을 다시 선택해도 onChange가 동작하도록 값을 비운다.
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

        onChange={() => void saveImgFile()}
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
