"use client";

import signOutAction from "@/app/components/auth/sign-out-button/actions";
import { useFormStatus } from "react-dom";
import LoadingSpinner from "@/app/components/loading-spinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={"button-black"}>
      {pending ? (
        <LoadingSpinner
          className={"size-6 border-2 border-t-white border-neutral-700"}
        />
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
