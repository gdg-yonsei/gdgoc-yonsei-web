import * as motion from 'motion/react-client'
import { ReactNode } from 'react'
import { Transition } from 'motion'

export default function PopUpDiv({
  children,
  className,
  transition,
}: {
  children: ReactNode
  className?: string
  transition?: Transition
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: 20 }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{ duration: 0.2, ...transition }}
      viewport={{ once: true }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}
