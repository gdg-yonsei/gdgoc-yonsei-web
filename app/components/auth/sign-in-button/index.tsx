"use client";

import signInAction from "@/app/components/auth/sign-in-button/actions";
import { useFormStatus } from "react-dom";
import { TailSpin } from "react-loader-spinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={"button-black w-full"}>
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
    <form action={() => signInAction("github")} className={"w-1/3 flex"}>
      <SubmitButton />
    </form>
  );
}
