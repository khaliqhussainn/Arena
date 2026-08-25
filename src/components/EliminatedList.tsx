"use client";

import type { Product } from "@/types/database";
import { PayButton } from "./PayButton";

export function EliminatedList({
  products,
  onPaid,
}: {
  products: Product[];
  onPaid?: () => void;
}) {
  if (products.length === 0) {
    return <p className="text-sm text-muted">No eliminations yet in this category.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/40">
      {products.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex flex-col">
            <a
              href={`/product/${p.id}`}
              className="text-sm font-medium text-ink/70 line-through decoration-crimson/50"
            >
              {p.name}
            </a>
            <span className="text-xs text-muted">{p.category}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-crimson/10 px-2.5 py-0.5 text-xs font-medium text-crimson">
              Eliminated
            </span>
            <PayButton type="revive" productId={p.id} onPaid={onPaid} />
          </div>
        </li>
      ))}
    </ul>
  );
}
