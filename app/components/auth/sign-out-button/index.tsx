"use client";

import { useActionState } from "react";
import { TailSpin } from "react-loader-spinner";
import signOutAction from "@/app/components/auth/sign-out-button/actions";

export function SignOutButton() {
  const [, submitAction, isPending] = useActionState(signOutAction, null);

  return (
    <form action={submitAction}>
      <button
        type="submit"
        disabled={isPending}
        className={
          "flex gap-2 items-center bg-neutral-900 text-white p-2 px-4 rounded-full transition-all"
        }
      >
        <TailSpin
          visible={isPending}
          color="#ffffff"
          radius="1"
          width={20}
          height={20}
          wrapperStyle={{}}
        />
        Sign Out
      </button>
    </form>
  );
}
