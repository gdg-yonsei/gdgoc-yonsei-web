"use client";

import { useFormStatus } from "react-dom";
import Github from "@/public/logo/github.svg";
import { TailSpin } from "react-loader-spinner";
import { useIsAuthenticating } from "@/lib/stores/is-authenticating";

export default function GithubSubmitButton() {
  const { pending } = useFormStatus();
  const { isAuthenticating, setIsAuthenticating } = useIsAuthenticating(
    (state) => state,
  );

  return (
    <button
      type={"submit"}
      className={"button-black"}
      disabled={pending || isAuthenticating}
      onClick={(e) => {
        setIsAuthenticating(true);
        e.currentTarget.click();
      }}
    >
      {pending ? (
        <TailSpin color="#ffffff" radius="1" width={24} height={24} />
      ) : (
        <Github className={"size-6"} />
      )}
      <p>Sign in with Github</p>
    </button>
  );
}
