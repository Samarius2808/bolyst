"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BoardCard } from "./BoardCard";
import { CreateBoardModal } from "./CreateBoardModal";

interface Board {
  id: string;
  name: string;
  _count: { listings: number; members: number };
  members: { user: { name: string | null; email: string } }[];
  listings: { imageUrls: string[] }[];
}

export function BoardList({ boards }: { boards: Board[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const t = useTranslations("boards");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {boards.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-xs font-medium">
            {boards.length !== 1
              ? t("countPlural", { count: boards.length })
              : t("count", { count: boards.length })}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-sage-600/20"
        >
          {t("newBoard")}
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 border border-zinc-100/80 dark:border-zinc-800 rounded-2xl">
          <svg
            className="mx-auto mb-5 text-sage-200"
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="8" y="12" width="40" height="32" rx="4" />
            <path d="M20 28h16M28 20v16" />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-2">
            {t("emptyTitle")}
          </h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">{t("emptyDescription")}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-sage-600/20"
          >
            {t("createBoard")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((b) => (
            <BoardCard
              key={b.id}
              id={b.id}
              name={b.name}
              listingCount={b._count.listings}
              memberCount={b._count.members}
              members={b.members}
              previewImages={b.listings
                .map((l) => l.imageUrls[0])
                .filter((u): u is string => Boolean(u))}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
