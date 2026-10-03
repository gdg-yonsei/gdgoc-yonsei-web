'use client'

/**
 * 프로필 이미지 업로드(클라이언트 컴포넌트). 멤버 수정·내 프로필 수정 화면이 함께 쓴다.
 *
 * 파일을 고르면 곧바로 업로드 API로 보내 R2에 저장하고 DB의 프로필 이미지를 바꾼다
 * (폼 제출과 별개). 숨은 필드에는 저장된 이미지 키를 실어 폼 제출 시 값이 유지되게 한다.
 */
import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { uploadProfileImageState } from '@/lib/admin/atoms'
import { uploadProfileImage } from '@/lib/upload-image'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import UserProfileImagePreview from '@/app/components/admin/user-profile-image-preview'
import SelectImageButton from '@/app/(admin)/admin/members/[memberId]/edit/select-image-button'

/**
 * 프로필 이미지 미리보기와 선택 버튼.
 * @param image 기존 프로필 이미지(URL 또는 R2 키)
 * @param memberId 이미지를 바꿀 멤버 id
 * @param name 숨은 필드 이름
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [imgFileUrl, setImgFileUrl] = useState('')
  const [isLoading, setIsLoading] = useAtom(uploadProfileImageState)
  const [profileImage, setProfileImage] = useState(image)
  const [hasFailed, setHasFailed] = useState(false)
  const { t } = useAdminI18n()

  /**
   * 선택한 파일을 업로드하고, 성공하면 저장된 이미지로 바꾼다. 업로드 중에는 dataURL 미리보기를 보여 준다.
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
        // 업로드 오류는 saveImgFile 안에서 처리한다.
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
