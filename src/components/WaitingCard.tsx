"use client";

import { useState } from "react";
import type { Product } from "@/types/database";

function buildInviteLink(product: Product): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ join: product.category, from: product.name });
  return `${origin}/?${params.toString()}`;
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
      // clipboard API unavailable — silently ignore, link is still shown via title
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {product.category} · Waiting for a challenger
        </span>
        <a href={`/product/${product.id}`} className="font-display text-lg font-semibold text-ink">
          {product.name}
        </a>
        <p className="text-sm text-muted">{product.pitch}</p>
      </div>
      <button
        onClick={copyInvite}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-crimson"
      >
        {copied ? "Link copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
