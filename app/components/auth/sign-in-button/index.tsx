"use client";

import { useActionState } from "react";
import { signInWithGithub } from "@/app/components/auth/sign-in-button/actions";
import { TailSpin } from "react-loader-spinner";

export default function SignInWithGithubButton() {
  const [, submitAction, isPending] = useActionState(signInWithGithub, null);

  return (
    <form action={submitAction}>
      <button
        type="submit"
        disabled={isPending}
        className={
          "flex gap-2 items-center p-2 px-4 rounded-full bg-neutral-900 text-white"
        }
      >
        {isPending ? (
          <TailSpin
            visible={true}
            color="#ffffff"
            radius="1"
            width={20}
            height={20}
            wrapperStyle={{}}
          />
        ) : (
          ""
        )}
        Sign In with Github
      </button>
    </form>
  );
}
