import LoadingSpinner from '@/app/components/loading-spinner'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { motion } from 'motion/react'

/**
 * 이미지 저장 버튼
 * @param isLoading - 로딩 상태
 * @param imgFile - 이미지 경로 URL
 * @param onClick - 클릭 이벤트 함수
 * @constructor
 */
export default function SaveImageButton({
  isLoading,
  imgFile,
  onClick,
}: {
  isLoading: boolean
  imgFile: string
  onClick: () => void
}) {
  return (
    <motion.button
      disabled={isLoading}
      type={'button'}
      initial={{ opacity: 0 }}
      animate={{ opacity: imgFile ? 1 : 0 }}
      className={
        'p-2 px-4 rounded-xl border-2 border-neutral-900 bg-neutral-900 transition-all disabled:bg-neutral-800 disabled:text-neutral-300 text-white flex items-center gap-2'
      }
      onClick={onClick}
    >
      {isLoading ? (
        <LoadingSpinner
          className={'size-6 border-2 border-t-white border-neutral-700'}
        />
      ) : (
        <CloudArrowUpIcon className={'size-6'} />
      )}
      <p>Save</p>
    </motion.button>
  )
}
