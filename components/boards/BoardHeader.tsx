"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BoardSettings } from "./BoardSettings";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

export function BoardHeader({
  board,
  isOwner,
}: {
  board: {
    id: string;
    name: string;
    members: Member[];
    listingCount: number;
  };
  isOwner: boolean;
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/boards"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-1"
          >
            <span>&larr;</span> Boards
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {board.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-zinc-400">
              {board.members.length} member{board.members.length !== 1 && "s"}
            </span>
            <span className="text-zinc-200">|</span>
            <span className="text-sm text-zinc-400">
              {board.listingCount} listing{board.listingCount !== 1 && "s"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {board.listingCount >= 2 && (
            <Link
              href={`/boards/${board.id}/compare`}
              className="px-4 py-2 text-sm font-medium border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              Compare
            </Link>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 text-sm font-medium border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Settings
          </button>
          <UserButton />
        </div>
      </div>

      {showSettings && (
        <BoardSettings
          boardId={board.id}
          boardName={board.name}
          isOwner={isOwner}
          members={board.members}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
