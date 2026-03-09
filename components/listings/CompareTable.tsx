"use client";

type ListingStatus = "NEW" | "VIEWING" | "APPLIED" | "REJECTED" | "ACCEPTED" | "DELISTED";

const statusLabels: Record<ListingStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-zinc-100 text-zinc-500" },
  VIEWING: { label: "Viewing", color: "bg-blue-50 text-blue-600" },
  APPLIED: { label: "Applied", color: "bg-amber-50 text-amber-600" },
  REJECTED: { label: "Rejected", color: "bg-red-50 text-red-500" },
  ACCEPTED: { label: "Accepted", color: "bg-emerald-50 text-emerald-600" },
  DELISTED: { label: "Delisted", color: "bg-zinc-200 text-zinc-500" },
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

export function CompareTable({ listings }: { listings: Listing[] }) {
  const dash = <span className="text-zinc-200">&mdash;</span>;

  const fields: {
    key: string;
    label: string;
    render: (l: Listing) => React.ReactNode;
  }[] = [
    {
      key: "price",
      label: "Price",
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
      render: (l) => (l.size != null ? `${l.size} m²` : dash),
    },
    {
      key: "pricePerM2",
      label: "Price/m²",
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
                className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-50 text-violet-600"
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
            className="text-violet-500 hover:text-violet-600 transition-colors"
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
            {listings.map((l) => (
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
              <td className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 sticky left-0 bg-inherit">
                {field.label}
              </td>
              {listings.map((l) => (
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
