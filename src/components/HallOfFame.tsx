"use client";

import type { ChampionWithProduct } from "@/lib/arena-state";
import { timeAgo } from "@/lib/format";
import { PayButton } from "./PayButton";

export function HallOfFame({
  champions,
  onPaid,
}: {
  champions: ChampionWithProduct[];
  onPaid?: () => void;
}) {
  if (champions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gold/40 p-6 text-center text-sm text-muted">
        No champions crowned yet — win 3 duels in a row to claim the throne.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {champions.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-2 rounded-2xl border border-gold/40 bg-gradient-to-br from-bg to-bg2 p-5 text-paper shadow-md transition hover:border-gold"
        >
          <span className="text-2xl">👑</span>
          <a href={`/product/${c.product_id}`} className="font-display text-lg font-semibold hover:text-gold-soft">
            {c.product.name}
          </a>
          <span className="text-xs font-mono uppercase tracking-wide text-gold-soft">
            {c.category}
          </span>
          <p className="text-sm text-muted">{c.product.pitch}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>Crowned {timeAgo(c.crowned_at)}</span>
            {c.times_defended > 0 && (
              <span className="text-gold-soft">Defended {c.times_defended}×</span>
            )}
          </div>
          {c.product.uncontested_wins > 0 && (
            <span className="text-xs text-muted">
              Includes {c.product.uncontested_wins} uncontested win
              {c.product.uncontested_wins > 1 ? "s" : ""}
            </span>
          )}
          {c.product.status === "champion" && (
            <PayButton
              type="defend"
              productId={c.product_id}
              onPaid={onPaid}
              className="mt-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-50"
            />
          )}
        </div>
      ))}
    </div>
  );
}
