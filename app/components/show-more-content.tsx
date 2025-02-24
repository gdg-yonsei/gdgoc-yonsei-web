'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'motion/react'

export default function ShowMoreContent({ children }: { children: ReactNode }) {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <button
        type={'button'}
        onClick={() => setShowMore(true)}
        className={`${showMore ? 'hidden' : ''} ml-auto text-base underline text-neutral-600 cursor-pointer`}
      >
        Show More
      </button>
      <motion.p
        initial={{ height: 0, opacity: 0, y: 20 }}
        animate={{
          height: showMore ? 'auto' : 0,
          opacity: showMore ? 1 : 0,
          y: showMore ? 0 : 20,
        }}
        exit={{ height: 0, opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        {children}
      </motion.p>
    </>
  )
}
