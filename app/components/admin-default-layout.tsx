import { ReactNode } from "react";

export default function AdminDefaultLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full min-h-screen pt-16 ${className}`}>{children}</div>
  );
}
