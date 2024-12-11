"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { KeyIcon } from "@heroicons/react/24/outline";
import { useIsAuthenticating } from "@/lib/stores/is-authenticating";

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
        <TailSpin color="#000000" radius="1" width={24} height={24} />
      ) : (
        <KeyIcon className={"size-6"} />
      )}
      <p>Sign in with Passkey</p>
    </button>
  );
}
