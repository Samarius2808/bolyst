"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function JoinBoardButton({ token }: { token: string }) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations("join");

  async function handleJoin() {
    setJoining(true);
    setError("");
    const res = await fetch(`/api/join/${encodeURIComponent(token)}`, { method: "POST" }).catch(
      () => null,
    );
    if (res?.ok) {
      const { boardId } = (await res.json()) as { boardId: string };
      router.push(`/boards/${boardId}`);
      router.refresh();
      return;
    }
    setError(res?.status === 404 ? t("invalidBody") : t("joinError"));
    setJoining(false);
  }

  return (
    <>
      <button
        onClick={handleJoin}
        disabled={joining}
        className="w-full px-5 py-3 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-60 shadow-md shadow-sage-600/20 active:scale-[0.98] transition-all"
      >
        {joining ? t("joining") : t("joinBoard")}
      </button>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </>
  );
}
