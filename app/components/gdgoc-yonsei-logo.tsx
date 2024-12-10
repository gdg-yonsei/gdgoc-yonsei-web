import GDGLogo from "@/public/logo/gdg.svg";

export default function GDGoCYonseiLogo({ className }: { className: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GDGLogo className={"w-24"} />
      <p>
        Google Developer Groups <br />
        on Campus Yonsei
      </p>
    </div>
  );
}
