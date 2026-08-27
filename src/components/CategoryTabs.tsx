"use client";

import { CATEGORIES } from "@/types/database";

export type TabValue = "All" | (typeof CATEGORIES)[number];
export const TABS: TabValue[] = ["All", ...CATEGORIES];

export function CategoryTabs({
  selected,
  onSelect,
  counts,
}: {
  selected: TabValue;
  onSelect: (tab: TabValue) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = tab === selected;
        return (
          <button
            key={tab}
            onClick={() => onSelect(tab)}
            className={`border px-4 py-1.5 text-xs font-bold uppercase tracking-wide shadow-none transition-transform duration-150 ease-out active:scale-95 ${
              active
                ? "border-border bg-accent text-accent-ink"
                : "border-border bg-transparent text-muted hover:text-ink"
            }`}
          >
            {tab}
            {counts[tab] ? (
              <span className="ml-1.5 font-mono text-xs opacity-70">{counts[tab]}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
