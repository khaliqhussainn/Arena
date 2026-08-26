"use client";

import { useState } from "react";

export function BadgeEmbed({ badgeUrl, productUrl }: { badgeUrl: string; productUrl: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<a href="${productUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="Arena Champion badge" width="220" height="64" /></a>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore, the snippet is still selectable
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- external, dynamically generated SVG; next/image can't handle this */}
      <img src={badgeUrl} alt="Arena Champion badge" width={220} height={64} className="rounded-lg" />
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-wide text-muted">
          Embed on your site
        </label>
        <textarea
          readOnly
          value={snippet}
          rows={2}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-lg border border-border bg-bg p-2 font-mono text-xs text-ink"
        />
        <button
          onClick={copy}
          className="self-start rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink transition hover:bg-accent-soft"
        >
          {copied ? "Copied!" : "Copy embed code"}
        </button>
      </div>
    </div>
  );
}
