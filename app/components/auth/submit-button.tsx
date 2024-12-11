"use client";

import Github from "@/public/logo/github.svg";
import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { TailSpin } from "react-loader-spinner";
import { KeyIcon } from "@heroicons/react/24/outline";

export default function SubmitButton({
  children,
  provider,
  className,
  loadingColor,
}: {
  children: ReactNode;
  provider?: string;
  className?: string;
  loadingColor?: string;
}) {
  const { pending } = useFormStatus();

  let icon: ReactNode | null = null;
  if (provider === "github") {
    icon = <Github className={"size-6"} />;
  } else if (provider === "passkey") {
    icon = <KeyIcon className={"size-6"} />;
  }

  return (
    <button type="submit" disabled={pending} className={`${className} w-full`}>
      {pending ? (
        <TailSpin color={loadingColor} radius="1" width={24} height={24} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
