'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'

export default function Modal({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <div
      className={
        'fixed top-0 left-0 z-20 flex h-screen w-full items-center justify-center bg-neutral-500/50 p-4'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          router.back()
        }
      }}
    >
      <div
        className={
          'relative h-full max-h-11/12 w-full max-w-6xl overflow-y-scroll rounded-2xl bg-neutral-50'
        }
      >
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 right-4 flex h-12 w-12 rotate-45 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm transition-all hover:bg-black/20"
        >
          <svg
            className="h-6 w-6 text-gray-800"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 5v14M5 12h14"></path>
          </svg>
        </motion.button>
        {children}
      </div>
    </div>
  )
}
