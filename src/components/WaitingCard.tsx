"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import type { Product } from "@/types/database";
import { ProductAvatar } from "./ProductAvatar";

function buildInviteLink(product: Product): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ join: product.category, from: product.name });
  return `${origin}/?${params.toString()}`;
}

function openTwitterIntent(product: Product) {
  const link = buildInviteLink(product);
  const text = `I just entered The Arena with ${product.name} in ${product.category}. Think your product can beat it? ⚔️`;
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
  window.open(intentUrl, "_blank", "noopener,noreferrer,width=550,height=420");
}

export function WaitingCard({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    const link = buildInviteLink(product);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore, the share intent still works
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-accent/40 bg-accent-soft/5 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ProductAvatar name={product.name} accent />
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
            <Swords className="h-3.5 w-3.5" />
            Waiting for a challenger
          </span>
          <a href={`/product/${product.id}`} className="font-display text-base font-bold text-ink">
            {product.name}
          </a>
          <p className="text-xs text-muted">
            {product.category} · {product.pitch}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={copyInvite}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          onClick={() => openTwitterIntent(product)}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-ink shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          Invite a Rival
        </button>
      </div>
    </div>
  );
}
