"use client";

import Link from "next/link";
import { useAtom } from "jotai";
import { menuBarState } from "@/lib/atoms";
import { motion } from "motion/react";
import { ReactNode } from "react";
import { navigationList } from "@/app/admin/navigation-list";
import UserAuthControlPanelClient from "@/app/components/admin/user-auth-control-panel-client";

function MenuBarNavigator({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link href={href} className={"text-xl font-semibold"} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function MenuBar() {
  const [isOpen, setIsOpen] = useAtom(menuBarState);

  return (
    <>
      <div
        className={`w-full flex justify-center transition-all bg-neutral-100 ${isOpen ? "h-[60vh]" : "h-0"}`}
      >
        {isOpen && (
          <div className={"w-full flex flex-col gap-4 p-4 max-w-4xl"}>
            {navigationList.map((item, i) => (
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
          className={"w-full h-[40vh] bg-neutral-500/50 backdrop-blur"}
        />
      )}
    </>
  );
}
