"use client";

import { signIn } from "next-auth/webauthn";
import SubmitButton from "@/app/components/auth/submit-button";

export default function PasskeySignInButton() {
  return (
    <form className={"flex"} action={() => signIn("passkey").then()}>
      <SubmitButton
        provider={"passkey"}
        className={"button-white"}
        loadingColor={"#000000"}
      >
        Sign In with Passkey
      </SubmitButton>
    </form>
  );
}
