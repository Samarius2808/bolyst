import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sage-50/40 via-white to-white">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="w-9 h-9 bg-sage-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sage-600/20">
            B
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Bolyst
          </h1>
        </div>
        <div className="w-8 h-1 bg-sage-500 rounded-full mx-auto mb-3" />
        <p className="text-base text-zinc-500">
          Find your place, together.
        </p>
      </div>
      <SignUp />
    </div>
  );
}
