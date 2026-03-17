"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SkyToggle } from "@/components/ui/sky-toggle";

export function ThemeSelector({ compact = false, toggleSize }: { compact?: boolean; toggleSize?: number }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={compact ? "w-[79px] h-[28px]" : "h-[35px]"} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-4">
      <SkyToggle
        checked={isDark}
        onChange={(dark) => setTheme(dark ? "dark" : "light")}
        size={toggleSize}
      />
      {!compact && (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      )}
    </div>
  );
}
