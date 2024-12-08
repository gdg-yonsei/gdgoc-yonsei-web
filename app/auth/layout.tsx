import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (session) {
    return redirect("/admin");
  }

  return <>{children}</>;
}
