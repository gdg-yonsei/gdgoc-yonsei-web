'use client'

import Link from 'next/link'
import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/atoms'
import { motion } from 'motion/react'
import { ReactNode } from 'react'
import { NavigationItem } from '@/app/admin/navigation-list'
import UserAuthControlPanelClient from '@/app/components/admin/user-auth-control-panel-client'

/**
 * 모바일 화면 상단 바에서 보이는 네비게이터
 * @param href
 * @param children
 * @param onClick
 * @constructor
 */
function MenuBarNavigator({
  href,
  children,
  onClick,
}: {
  href: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Link href={href} className={'text-xl font-semibold'} onClick={onClick}>
      {children}
    </Link>
  )
}

/**
 * 모바일 화면에서 보이는 상단 바 안의 메뉴 바
 * @constructor
 */
export default function MenuBar({
  navigations,
}: {
  navigations: NavigationItem[]
}) {
  const [isOpen, setIsOpen] = useAtom(menuBarState)

  return (
    <>
      <div
        className={`w-full flex justify-center transition-all bg-neutral-100 ${isOpen ? 'h-[60vh]' : 'h-0'}`}
      >
        {isOpen && (
          <div className={'w-full flex flex-col gap-4 p-4 max-w-4xl'}>
            {navigations.map((item, i) => (
              <MenuBarNavigator
                key={i}
                href={item.path}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </MenuBarNavigator>
            ))}
            <UserAuthControlPanelClient />
          </div>
        )}
      </div>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          onClick={() => setIsOpen(false)}
          className={'w-full h-[40vh] bg-neutral-500/50 backdrop-blur'}
        />
      )}
    </>
  )
}
