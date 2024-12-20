"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "@/app/components/loading-spinner";
import { useAtom } from "jotai";
import { isAuthenticatingState } from "@/lib/atoms";

export default function Passkey() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useAtom(
    isAuthenticatingState,
  );

  function offLoadingState() {
    setIsLoading(false);
    setIsAuthenticating(false);
  }

  return (
    <button
      type={"button"}
      onClick={() => {
        setIsLoading(true);
        setIsAuthenticating(true);
        signIn("passkey").then(offLoadingState).catch(offLoadingState);
      }}
      className={"button-white"}
      disabled={isLoading || isAuthenticating}
    >
      {isLoading ? (
        <LoadingSpinner
          className={"size-6 border-2 border-t-black border-neutral-300"}
        />
      ) : (
        <KeyIcon className={"size-6"} />
      )}
      <p>Sign in with Passkey</p>
    </button>
  );
}
