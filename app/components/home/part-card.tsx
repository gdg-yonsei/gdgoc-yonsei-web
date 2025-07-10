'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export function PartCard({
  title,
  content,
}: {
  title: string
  content: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      layout
      className={
        'relative flex min-h-80 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white p-6 ring-2 ring-white'
      }
      transition={{
        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="title"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <h3 className={'text-3xl font-semibold md:text-4xl'}>{title}</h3>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-col items-start justify-start"
          >
            <h3 className={'mb-4 text-2xl font-semibold'}>{title}</h3>
            <p className="text-sm leading-relaxed text-gray-700 md:text-base">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm transition-all hover:bg-black/20"
      >
        <motion.svg
          className="h-6 w-6 text-gray-800"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M12 5v14M5 12h14"></path>
        </motion.svg>
      </motion.button>
    </motion.div>
  )
}
