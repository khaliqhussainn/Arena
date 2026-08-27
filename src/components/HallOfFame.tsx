"use client";

import type { ChampionWithProduct } from "@/lib/arena-state";
import { timeAgo } from "@/lib/format";
import { PayButton } from "./PayButton";
import { CrownIcon } from "./icons";

export function HallOfFame({
  champions,
  onPaid,
}: {
  champions: ChampionWithProduct[];
  onPaid?: () => void;
}) {
  if (champions.length === 0) {
    return (
      <p className="border border-dashed border-border p-6 text-center text-sm text-muted">
        No champions crowned yet — win 3 duels in a row to claim the throne.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {champions.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-2 border border-border bg-surface p-5 transition-colors duration-150 ease-out hover:border-accent"
        >
          <CrownIcon className="h-6 w-6 text-accent" />
          <a href={`/product/${c.product_id}`} className="font-display text-lg font-semibold text-ink hover:text-accent">
            {c.product.name}
          </a>
          <span className="text-xs font-mono uppercase tracking-wide text-accent">
            {c.category}
          </span>
          <p className="text-sm text-muted">{c.product.pitch}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>Crowned {timeAgo(c.crowned_at)}</span>
            {c.times_defended > 0 && (
              <span className="bg-accent-soft px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-black">
                Times defended: {c.times_defended}
              </span>
            )}
          </div>
          {c.product.uncontested_wins > 0 && (
            <span className="text-xs text-muted">
              Includes {c.product.uncontested_wins} uncontested win
              {c.product.uncontested_wins > 1 ? "s" : ""}
            </span>
          )}
          {c.product.status === "champion" && (
            <PayButton type="defend" productId={c.product_id} onPaid={onPaid} />
          )}
        </div>
      ))}
    </div>
  );
}
