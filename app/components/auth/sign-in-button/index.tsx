"use client";

import signInAction from "@/app/components/auth/sign-in-button/actions";
import React, { ReactNode } from "react";
import SubmitButton from "@/app/components/auth/submit-button";

export default function SignInButton({
  provider,
  children,
}: {
  provider: string;
  children: ReactNode;
}) {
  return (
    <form action={() => signInAction(provider)} className={"flex"}>
      <SubmitButton
        className={"button-black"}
        provider={provider}
        loadingColor={"#ffffff"}
      >
        {children}
      </SubmitButton>
    </form>
  );
}
