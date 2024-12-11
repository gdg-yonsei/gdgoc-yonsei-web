"use client";

import { signIn } from "next-auth/webauthn";

export default function RegisterPasskeyButton() {
  return (
    <button
      type={"button"}
      className={"button-black"}
      onClick={() =>
        signIn("passkey", { action: "register" })
          .then(() => alert("The passkey has been registered."))
          .catch(() => alert("The passkey is already registered."))
      }
    >
      Register Passkey
    </button>
  );
}
