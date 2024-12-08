"use server";

import { signIn } from "@/auth";

export default async function signInAction(provider: string) {
  await signIn(provider);
}
