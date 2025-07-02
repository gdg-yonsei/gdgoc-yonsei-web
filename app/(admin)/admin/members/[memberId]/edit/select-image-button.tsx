import { PhotoIcon } from '@heroicons/react/24/outline'

/**
 * 이미지 선택 버튼
 * @param disabled - 비활성화 여부
 * @param onClick - 클릭 이벤트 함수
 * @constructor
 */
export default function SelectImageButton({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={
        'mx-auto flex items-center gap-2 rounded-xl border-2 border-neutral-900 p-2 px-4 transition-all disabled:bg-neutral-300'
      }
      type={'button'}
    >
      <PhotoIcon className={'size-6'} />
      <p>Select Image</p>
    </button>
  )
}
