import Link from "next/link";
import type { Product } from "@/types/database";
import { ProductAvatar } from "./ProductAvatar";
import { CrownIcon } from "./icons";

export function Leaderboard({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        No active win streaks yet — submit a product and start fighting.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-bold text-ink">Leaderboard</h3>
        <span className="text-xs text-muted">By current win streak</span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {products.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/product/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-surface-2"
            >
              <span className="w-4 shrink-0 font-mono text-sm text-muted">{i + 1}</span>
              <ProductAvatar name={p.name} size="sm" accent={p.status === "champion"} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-ink">{p.name}</span>
                <span className="text-xs text-muted">{p.category}</span>
              </div>
              {p.status === "champion" && (
                <CrownIcon className="h-4 w-4 shrink-0 text-accent" style={{ animation: "crown-float 3s ease-in-out infinite" }} />
              )}
              <span className="shrink-0 font-mono text-sm font-bold text-ink">
                {p.wins} {p.wins === 1 ? "win" : "wins"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
