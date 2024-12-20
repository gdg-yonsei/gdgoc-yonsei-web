"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";
import { useIsAuthenticating } from "@/lib/stores/is-authenticating";
import LoadingSpinner from "@/app/components/loading-spinner";

export default function Passkey() {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticating, setIsAuthenticating } = useIsAuthenticating(
    (state) => state,
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
