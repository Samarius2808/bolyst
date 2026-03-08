"use client";

import Link from "next/link";

interface BoardCardProps {
  id: string;
  name: string;
  listingCount: number;
  memberCount: number;
}

export function BoardCard({ id, name, listingCount, memberCount }: BoardCardProps) {
  return (
    <Link
      href={`/boards/${id}`}
      className="group block bg-white border border-zinc-100 rounded-2xl p-5 hover:shadow-lg hover:border-zinc-200 transition-all duration-200"
    >
      <h3 className="font-semibold text-base text-zinc-900 truncate group-hover:text-violet-600 transition-colors">
        {name}
      </h3>
      <div className="flex gap-4 mt-2.5 text-sm text-zinc-400">
        <span>{listingCount} listing{listingCount !== 1 && "s"}</span>
        <span>{memberCount} member{memberCount !== 1 && "s"}</span>
      </div>
    </Link>
  );
}
