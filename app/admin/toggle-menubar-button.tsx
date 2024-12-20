"use client";

import { Bars2Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAtom } from "jotai";
import { menuBarState } from "@/lib/atoms";

export default function ToggleMenubarButton() {
  const [isOpen, setIsOpen] = useAtom(menuBarState);

  return (
    <button type={"button"} onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? (
        <XMarkIcon className={"size-8"} />
      ) : (
        <Bars2Icon className={"size-8"} />
      )}
    </button>
  );
}
