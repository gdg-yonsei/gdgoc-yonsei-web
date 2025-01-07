import { PhotoIcon } from '@heroicons/react/24/outline'

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
        'p-2 px-4 rounded-xl ring-2 ring-neutral-900 disabled:bg-neutral-300 flex items-center gap-2 transition-all'
      }
      type={'button'}
    >
      <PhotoIcon className={'size-6'} />
      <p>Select Image</p>
    </button>
  )
}
