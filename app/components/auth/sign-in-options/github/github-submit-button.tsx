"use client";

import { useFormStatus } from "react-dom";
import Github from "@/public/logo/github.svg";
import { useIsAuthenticating } from "@/lib/stores/is-authenticating";
import LoadingSpinner from "@/app/components/loading-spinner";

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
        <LoadingSpinner
          className={"size-6 border-2 border-t-white border-neutral-700"}
        />
      ) : (
        <Github className={"size-6"} />
      )}
      <p>Sign in with Github</p>
    </button>
  );
}
