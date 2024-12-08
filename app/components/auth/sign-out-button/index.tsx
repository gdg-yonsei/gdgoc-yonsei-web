"use client";

import { TailSpin } from "react-loader-spinner";
import signOutAction from "@/app/components/auth/sign-out-button/actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        "flex gap-2 items-center bg-neutral-900 text-white p-2 px-4 rounded-full transition-all"
      }
    >
      <TailSpin
        visible={pending}
        color="#ffffff"
        radius="1"
        width={20}
        height={20}
      />
      Sign Out
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
