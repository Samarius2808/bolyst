"use client";

import { useState } from "react";
import { BoardCard } from "./BoardCard";
import { CreateBoardModal } from "./CreateBoardModal";

interface Board {
  id: string;
  name: string;
  _count: { listings: number; members: number };
}

export function BoardList({ boards }: { boards: Board[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {boards.length > 0
            ? `${boards.length} board${boards.length !== 1 ? "s" : ""}`
            : "No boards yet"}
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
        >
          + New board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-100 rounded-2xl">
          <p className="text-zinc-500 mb-1">
            Create your first board to start saving apartments.
          </p>
          <p className="text-sm text-zinc-400">
            Invite roommates or partners to decide together.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => (
            <BoardCard
              key={b.id}
              id={b.id}
              name={b.name}
              listingCount={b._count.listings}
              memberCount={b._count.members}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
