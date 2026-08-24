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
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active
                ? "border-gold bg-gold text-ink"
                : "border-ink/10 bg-transparent text-ink/70 hover:border-gold/50"
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
