"use client";

import signInAction from "@/app/components/auth/sign-in-button/actions";
import { useFormStatus } from "react-dom";
import { TailSpin } from "react-loader-spinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        "flex gap-2 items-center p-2 px-4 rounded-full bg-neutral-900 text-white transition-all"
      }
    >
      <TailSpin
        visible={pending}
        color="#ffffff"
        radius="1"
        width={20}
        height={20}
      />
      Sign In with Github
    </button>
  );
}

export default function SignInWithGithubButton() {
  return (
    <form action={() => signInAction("github")}>
      <SubmitButton />
    </form>
  );
}
