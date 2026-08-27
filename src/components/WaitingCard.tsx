"use client";

import { useState } from "react";
import type { Product } from "@/types/database";

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
    <div className="flex flex-col gap-3 border border-dashed border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs font-bold uppercase tracking-wide text-muted">
          STATUS: WAITING FOR CHALLENGER · {product.category}
        </span>
        <a href={`/product/${product.id}`} className="font-display text-lg font-semibold text-ink">
          {product.name}
        </a>
        <p className="text-sm text-muted">{product.pitch}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={copyInvite}
          aria-label="Copy invite link"
          className="border border-border bg-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink shadow-none transition-transform duration-150 ease-out hover:border-accent active:scale-95"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          onClick={() => openTwitterIntent(product)}
          className="border border-border bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-ink shadow-none transition-transform duration-150 ease-out hover:bg-accent-soft active:scale-95"
        >
          Invite a rival
        </button>
      </div>
    </div>
  );
}
