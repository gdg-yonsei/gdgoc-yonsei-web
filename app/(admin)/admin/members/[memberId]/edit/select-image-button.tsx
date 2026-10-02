/**
 * 이미지 선택 버튼(클라이언트 컴포넌트). 숨은 파일 입력을 대신 열어 준다.
 */
import { PhotoIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 이미지 선택 버튼.
 * @param disabled 업로드 중 비활성화
 * @param onClick 파일 선택 창을 여는 함수
 */
export default function SelectImageButton({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  const { t } = useAdminI18n()

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={
        'border-hairline disabled:bg-surface-sunken mx-auto flex items-center gap-2 rounded-xl border-2 p-2 px-4 transition-all'
      }
      type={'button'}
    >
      <PhotoIcon className={'size-6'} />
      <p>{t('selectImage')}</p>
    </button>
  )
}
