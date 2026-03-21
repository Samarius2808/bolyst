"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { BoardSettings } from "./BoardSettings";
import { AddListingModal } from "../listings/AddListingModal";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

const avatarColors = [
  "bg-sage-100 text-sage-600",
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
  boardTags = [],
}: {
  board: {
    id: string;
    name: string;
    members: Member[];
    listingCount: number;
    pendingInvites: string[];
  };
  isOwner: boolean;
  boardTags?: { id: string; name: string }[];
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const t = useTranslations("boardHeader");
  const tb = useTranslations("boards");

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    if (showMobileMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMobileMenu]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="min-w-0">
          <Link
            href="/boards"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-sage-600 transition-colors mb-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {t("boards")}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            {board.name}
          </h1>
          <div className="flex items-center gap-2.5 mt-1.5">
            <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-500 dark:text-zinc-400">
              {board.listingCount !== 1
                ? tb("listingCountPlural", { count: board.listingCount })
                : tb("listingCount", { count: board.listingCount })}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {board.members.slice(0, 5).map((m, i) => (
                  <div
                    key={m.id}
                    className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} text-[11px] font-semibold flex items-center justify-center border-2 border-[#faf9f7] dark:border-[#111110]`}
                    title={m.user.name || m.user.email}
                  >
                    {getInitial(m.user.name, m.user.email)}
                  </div>
                ))}
                {board.members.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium flex items-center justify-center border-2 border-[#faf9f7] dark:border-[#111110]">
                    +{board.members.length - 5}
                  </div>
                )}
              </div>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                {board.members.length !== 1
                  ? tb("memberCountPlural", { count: board.members.length })
                  : tb("memberCount", { count: board.members.length })}
              </span>
            </div>
          </div>
        </div>
        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-sage-600/20"
          >
            {t("addListing")}
          </button>
          {board.listingCount >= 2 && (
            <Link
              href={`/boards/${board.id}/compare`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-sage-200 hover:text-sage-600 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="2" width="5" height="12" rx="1" />
                <rect x="10" y="2" width="5" height="12" rx="1" />
              </svg>
              {t("compare")}
            </Link>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-sage-200 hover:text-sage-600 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
            </svg>
            {t("settings")}
          </button>
          <UserButton />
        </div>
        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center justify-center w-10 h-10 bg-sage-600 text-white rounded-xl active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="inline-flex items-center justify-center w-10 h-10 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {showMobileMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-48 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/5 py-1">
                {board.listingCount >= 2 && (
                  <Link
                    href={`/boards/${board.id}/compare`}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="2" width="5" height="12" rx="1" />
                      <rect x="10" y="2" width="5" height="12" rx="1" />
                    </svg>
                    {t("compare")}
                  </Link>
                )}
                <button
                  onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="2.5" />
                    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
                  </svg>
                  {t("settings")}
                </button>
              </div>
            )}
          </div>
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

      {showAdd && (
        <AddListingModal
          boardId={board.id}
          boardTags={boardTags}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
