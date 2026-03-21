'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'

export default function ShowMoreContent({ children }: { children: ReactNode }) {
  const [showMore, setShowMore] = useState(false)
  const shouldReduce = useReducedMotion()

  return (
    <>
      <button
        type={'button'}
        onClick={() => setShowMore(true)}
        className={`${showMore ? 'hidden' : ''} ml-auto cursor-pointer text-base text-neutral-600 underline md:hidden`}
      >
        Show More
      </button>
      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-400 ease-in-out md:hidden"
        style={{
          gridTemplateRows: showMore ? '1fr' : '0fr',
        }}
      >
        <motion.div
          className="min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: showMore ? 1 : 0 }}
          transition={
            shouldReduce ? { duration: 0 } : { duration: 0.4, ease: 'easeInOut' }
          }
        >
          {children}
        </motion.div>
      </div>
      <div className={'not-md:hidden'}>{children}</div>
    </>
  )
}
