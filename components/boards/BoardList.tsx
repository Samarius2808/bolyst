"use client";

import { useState } from "react";
import { BoardCard } from "./BoardCard";
import { CreateBoardModal } from "./CreateBoardModal";

interface Board {
  id: string;
  name: string;
  _count: { listings: number; members: number };
  members: { user: { name: string | null; email: string } }[];
}

export function BoardList({ boards }: { boards: Board[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {boards.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium">
            {boards.length} board{boards.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-600/20"
        >
          + New board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-100/80 rounded-2xl">
          <svg
            className="mx-auto mb-5 text-violet-200"
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
          <h3 className="text-lg font-semibold text-zinc-700 mb-2">
            Create your first board
          </h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
            A board is a shared space for saving and comparing apartments with
            your people.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-600/20"
          >
            + Create board
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
            />
          ))}
        </div>
      )}

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
