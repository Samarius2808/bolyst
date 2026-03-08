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

const avatarColors = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

function getInitial(name: string | null, email: string): string {
  return (name?.[0] || email[0] || "?").toUpperCase();
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
    pendingInvites: string[];
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-violet-600 transition-colors mb-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            Boards
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            {board.name}
          </h1>
          <div className="flex items-center gap-2.5 mt-1.5">
            <span className="px-2.5 py-0.5 bg-zinc-100 rounded-full text-xs text-zinc-500">
              {board.listingCount} listing{board.listingCount !== 1 ? "s" : ""}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {board.members.slice(0, 5).map((m, i) => (
                  <div
                    key={m.id}
                    className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} text-[11px] font-semibold flex items-center justify-center border-2 border-[#faf9f7]`}
                    title={m.user.name || m.user.email}
                  >
                    {getInitial(m.user.name, m.user.email)}
                  </div>
                ))}
                {board.members.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium flex items-center justify-center border-2 border-[#faf9f7]">
                    +{board.members.length - 5}
                  </div>
                )}
              </div>
              <span className="text-xs text-zinc-400">
                {board.members.length} member{board.members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {board.listingCount >= 2 && (
            <Link
              href={`/boards/${board.id}/compare`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 hover:border-violet-200 hover:text-violet-600 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="2" width="5" height="12" rx="1" />
                <rect x="10" y="2" width="5" height="12" rx="1" />
              </svg>
              Compare
            </Link>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 hover:border-violet-200 hover:text-violet-600 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
            </svg>
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
          initialPendingInvites={board.pendingInvites}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
