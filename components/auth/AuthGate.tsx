"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Shown when a server component can't resolve the user (e.g. right after
 * Clerk signup, before the session cookie is fully propagated).
 * Waits for the client-side session to load, then either refreshes (if
 * signed in) or redirects to sign-in (if truly unauthenticated).
 */
export function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.refresh();
    } else {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    </div>
  );
}
