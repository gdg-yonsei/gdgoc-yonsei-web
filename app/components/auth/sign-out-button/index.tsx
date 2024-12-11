"use client";

import { TailSpin } from "react-loader-spinner";
import signOutAction from "@/app/components/auth/sign-out-button/actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={"button-black"}>
      {pending ? (
        <TailSpin color="#ffffff" radius="1" width={24} height={24} />
      ) : (
        ""
      )}
      <p>Sign Out</p>
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
