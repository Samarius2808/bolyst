import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-violet-50/40 via-white to-white">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-violet-600/20">
            S
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            SVEEN
          </h1>
        </div>
        <div className="w-8 h-1 bg-violet-500 rounded-full mx-auto mb-3" />
        <p className="text-base text-zinc-500">
          Find your place, together.
        </p>
      </div>
      <SignIn />
    </div>
  );
}
