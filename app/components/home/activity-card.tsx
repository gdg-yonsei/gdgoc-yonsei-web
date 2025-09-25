'use client'

import { Dispatch, SetStateAction } from 'react'
import { motion } from 'motion/react'
import { ModalType } from '@/app/components/home/activities-list'

export default function ActivityCard({
  title,
  content,
  className,
  modal,
  setModal,
}: {
  title: string
  content: { en: string; ko: string }
  className?: string
  modal: ModalType
  setModal: Dispatch<SetStateAction<ModalType>>
}) {
  const isThisCardOpen = modal && modal.title === title

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={'h-full w-full snap-center'}
    >
      <motion.div
        layoutId={`activity-card-${title}`}
        className={`flex aspect-4/5 h-full w-64 cursor-pointer items-center justify-center rounded-xl p-4 transition-opacity ${className}`}
        onClick={() => setModal({ title, content })}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: isThisCardOpen ? 0 : 1,
          borderRadius: 12,
        }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { type: 'spring', stiffness: 300, damping: 30 },
          borderRadius: { duration: 0.3 },
        }}
        style={{ borderRadius: 12 }}
      >
        <motion.h3
          layoutId={`activity-title-${title}`}
          className={
            'text-center text-3xl font-semibold break-words text-white'
          }
        >
          {title}
        </motion.h3>
      </motion.div>
    </motion.div>
  )
}
