"use client";

import { useActionState } from "react";
import { TailSpin } from "react-loader-spinner";
import { signInAction } from "@/app/components/auth/sign-in-button/actions";

export default function SignInWithGithubButton() {
  const [, submitAction, isPending] = useActionState(
    () => signInAction("github"),
    null,
  );

  return (
    <form action={submitAction}>
      <button
        type="submit"
        disabled={isPending}
        className={
          "flex gap-2 items-center p-2 px-4 rounded-full bg-neutral-900 text-white transition-all"
        }
      >
        <TailSpin
          visible={isPending}
          color="#ffffff"
          radius="1"
          width={20}
          height={20}
        />
        Sign In with Github
      </button>
    </form>
  );
}
