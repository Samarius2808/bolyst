"use client";

import dynamic from "next/dynamic";

const ListingMapInner = dynamic(() => import("./ListingMap").then((mod) => mod.ListingMap), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[400px] bg-[#f4f2ed] dark:bg-[#1b1b19] rounded-2xl animate-pulse" />
  ),
});

export function ListingMapWrapper(props: React.ComponentProps<typeof ListingMapInner>) {
  return <ListingMapInner {...props} />;
}
