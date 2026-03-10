"use client";

import { useState, useMemo } from "react";

type ListingStatus = "NEW" | "VIEWING" | "APPLIED" | "REJECTED" | "ACCEPTED" | "DELISTED";

const statusLabels: Record<ListingStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-zinc-100 text-zinc-500" },
  VIEWING: { label: "Viewing", color: "bg-blue-50 text-blue-600" },
  APPLIED: { label: "Applied", color: "bg-amber-50 text-amber-600" },
  REJECTED: { label: "Rejected", color: "bg-red-50 text-red-500" },
  ACCEPTED: { label: "Accepted", color: "bg-emerald-50 text-emerald-600" },
  DELISTED: { label: "Delisted", color: "bg-zinc-200 text-zinc-500" },
};

const statusOrder: Record<string, number> = {
  NEW: 0, VIEWING: 1, APPLIED: 2, ACCEPTED: 3, REJECTED: 4, DELISTED: 5,
};

interface Listing {
  id: string;
  title: string;
  sourceUrl: string | null;
  price: number | null;
  size: number | null;
  location: string | null;
  description: string | null;
  status: ListingStatus;
  tags: { tag: { id: string; name: string } }[];
  addedBy?: { id: string; name: string | null; email: string } | null;
}

type SortField = "price" | "size" | "pricePerM2" | "status" | null;
type SortDir = "asc" | "desc";

export function CompareTable({ listings }: { listings: Listing[] }) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const dash = <span className="text-zinc-200">&mdash;</span>;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortField) return listings;
    const arr = [...listings];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortField) {
        case "price":
          return ((a.price ?? Infinity) - (b.price ?? Infinity)) * dir;
        case "size":
          return ((a.size ?? -1) - (b.size ?? -1)) * dir;
        case "pricePerM2": {
          const aPpm2 = a.price != null && a.size ? a.price / a.size : Infinity;
          const bPpm2 = b.price != null && b.size ? b.price / b.size : Infinity;
          return (aPpm2 - bPpm2) * dir;
        }
        case "status":
          return ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)) * dir;
        default:
          return 0;
      }
    });
    return arr;
  }, [listings, sortField, sortDir]);

  function SortIcon({ field }: { field: SortField }) {
    const active = sortField === field;
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded ml-1.5 transition-all ${
          active
            ? "bg-sage-100 text-sage-700"
            : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-500"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${
            active && sortDir === "desc" ? "rotate-180" : ""
          }`}
        >
          <path d="M4 10l4-4 4 4" />
        </svg>
      </span>
    );
  }

  const fields: {
    key: string;
    label: string;
    sortable?: SortField;
    render: (l: Listing) => React.ReactNode;
  }[] = [
    {
      key: "price",
      label: "Price",
      sortable: "price",
      render: (l) =>
        l.price != null ? (
          <span className="font-semibold text-zinc-900">
            &euro;{l.price.toLocaleString()}/mo
          </span>
        ) : (
          dash
        ),
    },
    {
      key: "size",
      label: "Size",
      sortable: "size",
      render: (l) => (l.size != null ? `${l.size} m²` : dash),
    },
    {
      key: "pricePerM2",
      label: "Price/m²",
      sortable: "pricePerM2",
      render: (l) =>
        l.price != null && l.size
          ? `€${Math.round(l.price / l.size).toLocaleString()}`
          : dash,
    },
    {
      key: "location",
      label: "Location",
      render: (l) => l.location || dash,
    },
    {
      key: "status",
      label: "Status",
      sortable: "status",
      render: (l) => {
        const s = statusLabels[l.status] || statusLabels.NEW;
        return (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      key: "tags",
      label: "Tags",
      render: (l) =>
        l.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {l.tags.map((t) => (
              <span
                key={t.tag.id}
                className="px-2 py-0.5 text-xs font-medium rounded-full bg-sage-50 text-sage-600"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        ) : (
          dash
        ),
    },
    {
      key: "addedBy",
      label: "Added by",
      render: (l) => {
        const name = l.addedBy?.name || l.addedBy?.email?.split("@")[0];
        return name ? <span className="text-zinc-600">{name}</span> : dash;
      },
    },
    {
      key: "source",
      label: "Link",
      render: (l) =>
        l.sourceUrl ? (
          <a
            href={l.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-500 hover:text-sage-600 transition-colors"
          >
            View &rarr;
          </a>
        ) : (
          dash
        ),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 sticky left-0 bg-white min-w-[100px]">
              Field
            </th>
            {sorted.map((l) => (
              <th
                key={l.id}
                className="text-left py-4 px-5 font-semibold text-zinc-900 min-w-[200px]"
              >
                {l.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field, i) => (
            <tr
              key={field.key}
              className={`border-b border-zinc-50 ${
                i % 2 === 0 ? "bg-zinc-50/50" : ""
              }`}
            >
              <td
                className={`py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 sticky left-0 bg-inherit group ${
                  field.sortable ? "cursor-pointer hover:text-zinc-600 select-none" : ""
                }`}
                onClick={field.sortable ? () => toggleSort(field.sortable!) : undefined}
              >
                <span className="inline-flex items-center">
                  {field.label}
                  {field.sortable && <SortIcon field={field.sortable} />}
                </span>
              </td>
              {sorted.map((l) => (
                <td key={l.id} className="py-3.5 px-5 text-zinc-600">
                  {field.render(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
