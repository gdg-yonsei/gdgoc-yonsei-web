"use client";

import Link from "next/link";
import { useAtom } from "jotai";
import { menuBarState } from "@/lib/atoms";
import { motion } from "motion/react";

export default function MenuBar() {
  const [isOpen, setIsOpen] = useAtom(menuBarState);

  return (
    <>
      <div
        className={`w-full flex justify-center transition-all bg-neutral-100 ${isOpen ? "h-[60vh]" : "h-0"}`}
      >
        {isOpen && (
          <div className={"w-full flex flex-col gap-4 p-4 max-w-4xl"}>
            <Link
              href={"/admin"}
              className={"text-xl font-semibold hover:underline"}
              onClick={() => setIsOpen(false)}
            >
              Admin Home
            </Link>
            <Link
              href={"/admin/members"}
              className={"text-xl font-semibold hover:underline"}
              onClick={() => setIsOpen(false)}
            >
              Members
            </Link>
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
