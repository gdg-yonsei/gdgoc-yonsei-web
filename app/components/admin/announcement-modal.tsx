'use client'

/** 레이아웃이 아직 닫지 않은 공지 하나를 넘긴다. 닫기와 버튼 이동 모두 읽음으로 기록한다. */
import Link from 'next/link'
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MegaphoneIcon } from '@heroicons/react/24/outline'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'
import { useDialogFocus } from '@/lib/hooks/use-dialog-focus'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { localizeAdminHref } from '@/lib/admin-i18n'
import { markAnnouncementReadAction } from '@/app/components/admin/announcement-actions'
import type { UnreadAnnouncement } from '@/lib/server/fetcher/admin/get-announcements'

export default function AnnouncementModal({
  announcement,
}: {
  announcement: UnreadAnnouncement
}) {
  const { t, locale } = useAdminI18n()
  const shouldReduce = useReducedMotion()
  const [isOpen, setIsOpen] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const panelMotion = shouldReduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.97 },
        transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
      }

  function dismiss() {
    setIsOpen(false)
    void markAnnouncementReadAction(announcement.id)
  }

  useDialogFocus({ isOpen, panelRef, onClose: dismiss })

  const titleId = `announcement-${announcement.id}-title`
  const bodyId = `announcement-${announcement.id}-body`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={'announcement-modal'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={
            'fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4'
          }
        >
          <motion.div
            {...panelMotion}
            ref={panelRef}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className={
              'bg-surface shadow-elevated flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl p-6'
            }
          >
            <p
              className={
                'type-caption text-primary flex items-center gap-1.5 font-semibold'
              }
            >
              <MegaphoneIcon className={'size-4'} aria-hidden={'true'} />
              {t('announcement')}
            </p>
            <h2
              id={titleId}
              className={'type-heading-3 text-ink text-balance break-keep'}
            >
              {announcement.title}
            </h2>
            <p
              id={bodyId}
              className={
                'type-body-sm text-ink-muted break-keep whitespace-pre-line'
              }
            >
              {announcement.body}
            </p>
            <div className={'flex flex-col-reverse gap-2 pt-2 sm:flex-row'}>
              <button
                type={'button'}
                onClick={dismiss}
                className={'admin-btn-secondary flex-1'}
              >
                {t('close')}
              </button>
              {announcement.ctaHref && announcement.ctaLabel && (
                <Link
                  href={localizeAdminHref(announcement.ctaHref, locale)}
                  onClick={dismiss}
                  className={'admin-btn-primary flex-1'}
                >
                  {announcement.ctaLabel}
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
