import SignInWithGithubButton from "@/app/components/auth/sign-in-button";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div
      className={
        "w-screen h-screen flex flex-col items-center justify-center p-4"
      }
    >
      <div
        className={
          "p-4 md:p-8 rounded-xl md:rounded-2xl flex flex-col md:flex-row gap-4 items-center md:justify-around justify-center w-full max-w-3xl bg-white shadow-xl h-1/2 relative"
        }
      >
        <Image
          src={"/logo/yonsei.png"}
          alt={"GDGoC Yonsei Logo"}
          width={222}
          height={31}
          className={"md:absolute top-8 left-8 mr-auto"}
        />
        <div className={"flex gap-4 flex-col md:w-2/3 w-full"}>
          <div
            className={
              "flex flex-col gap-1 items-start text-2xl md:text-4xl font-bold"
            }
          >
            <h1>GDGoC Yonsei</h1>
            <h1>Management System</h1>
          </div>
        </div>
        <SignInWithGithubButton />
      </div>
    </div>
  );
}
