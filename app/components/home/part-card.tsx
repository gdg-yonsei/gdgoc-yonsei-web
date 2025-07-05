'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function PartCard({
  title,
  content,
}: {
  title: string
  content: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={
        'relative flex aspect-square flex-col items-center justify-center rounded-2xl bg-white p-4 py-12 ring-2 ring-white'
      }
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <h3 className={'text-4xl font-semibold'}>{title}</h3>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center text-left"
          >
            <p className="text-lg leading-relaxed">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
      >
        <motion.svg
          className="h-6 w-6 text-gray-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 0 : 45 }}
          transition={{ duration: 0.3 }}
        >
          <path d="M6 18L18 6M6 6l12 12"></path>
        </motion.svg>
      </motion.button>
    </div>
  )
}
