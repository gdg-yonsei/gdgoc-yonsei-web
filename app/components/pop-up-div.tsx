import * as motion from 'motion/react-client'
import { ReactNode } from 'react'
import { TargetAndTransition } from 'motion'

export default function PopUpDiv({
  children,
  className,
  transition,
}: {
  children: ReactNode
  className?: string
  transition?: TargetAndTransition
}) {
  return (
    <motion.div
      className={className}
      initial={{ height: 0, opacity: 0, y: 20 }}
      exit={{ height: 0, opacity: 0, y: 20 }}
      whileInView={{
        height: 'auto',
        opacity: 1,
        y: 0,
      }}
      transition={{ duration: 0.2, ...transition }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}
