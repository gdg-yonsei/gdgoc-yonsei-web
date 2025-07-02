import * as motion from 'motion/react-client'
import { ReactNode } from 'react'
import { Transition } from 'motion'

export default function OpacityDiv({
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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className={className}
      transition={{ duration: 0.5, ...transition }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}
