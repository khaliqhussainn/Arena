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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div key={p.id} className="relative flex flex-col gap-2 overflow-hidden border border-border bg-surface p-5">
          <div className="pointer-events-none absolute -right-12 top-5 w-40 rotate-45 bg-danger py-1 text-center text-[10px] font-bold uppercase tracking-widest text-danger-ink">
            Eliminated
          </div>
          <a
            href={`/product/${p.id}`}
            className="max-w-[75%] font-display text-lg font-semibold text-muted hover:text-ink"
          >
            {p.name}
          </a>
          <span className="text-xs font-mono uppercase tracking-wide text-muted">{p.category}</span>
          <PayButton
            type="revive"
            productId={p.id}
            onPaid={onPaid}
            className="mt-1 rounded-none border border-danger bg-danger px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-danger-ink shadow-none transition-transform duration-150 ease-out active:scale-95"
          />
        </div>
      ))}
    </div>
  );
}
