"use client";

import Link from "next/link";
import type { Product } from "@/types/database";
import { PayButton } from "./PayButton";
import { ProductAvatar } from "./ProductAvatar";

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
        <div
          key={p.id}
          className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-5 opacity-80 shadow-sm transition-opacity duration-150 ease-out hover:opacity-100"
        >
          <div className="pointer-events-none absolute -right-11 top-4 w-36 rotate-45 bg-danger py-1 text-center text-[10px] font-bold uppercase tracking-widest text-danger-ink shadow-sm">
            Eliminated
          </div>
          <ProductAvatar name={p.name} />
          <div className="flex flex-col gap-0.5">
            <Link href={`/product/${p.id}`} className="max-w-[70%] font-display text-base font-bold text-muted hover:text-ink">
              {p.name}
            </Link>
            <span className="text-xs text-muted">{p.category}</span>
          </div>
          <PayButton type="revive" productId={p.id} onPaid={onPaid} />
        </div>
      ))}
    </div>
  );
}
