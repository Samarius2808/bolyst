"use client";

import Link from "next/link";

interface BoardCardProps {
  id: string;
  name: string;
  listingCount: number;
  memberCount: number;
  members: { user: { name: string | null; email: string } }[];
}

function getInitial(name: string | null, email: string): string {
  return (name?.[0] || email[0] || "?").toUpperCase();
}

const avatarColors = [
  "bg-sage-100 text-sage-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

export function BoardCard({
  id,
  name,
  listingCount,
  memberCount,
  members,
}: BoardCardProps) {
  return (
    <Link
      href={`/boards/${id}`}
      className="group block bg-white border border-zinc-100/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-sage-200/60 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="h-1 bg-gradient-to-r from-sage-500 to-sage-400" />
      <div className="p-5 pt-4">
        <h3 className="font-semibold text-[15px] text-zinc-900 truncate group-hover:text-sage-600 transition-colors leading-snug">
          {name}
        </h3>

        <div className="flex gap-3 mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="12" height="12" rx="2" />
              <path d="M5 6h6M5 9h4" />
            </svg>
            {listingCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5.5" r="2.5" />
              <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
            </svg>
            {memberCount}
          </span>
        </div>

        {members.length > 0 && (
          <div className="flex items-center mt-3.5 pt-3.5 border-t border-zinc-50">
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} text-[10px] font-semibold flex items-center justify-center border-2 border-white`}
                  title={m.user.name || m.user.email}
                >
                  {getInitial(m.user.name, m.user.email)}
                </div>
              ))}
              {memberCount > 4 && (
                <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium flex items-center justify-center border-2 border-white">
                  +{memberCount - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
