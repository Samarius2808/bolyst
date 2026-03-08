import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          SVEEN
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Find your place, together.
        </p>
      </div>
      <SignIn />
    </div>
  );
}
