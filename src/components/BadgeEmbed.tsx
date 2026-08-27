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
      <img src={badgeUrl} alt="Arena Champion badge" width={220} height={64} />
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-bold uppercase tracking-wide text-muted">
          Embed on your site
        </label>
        {/* Fixed dark styling regardless of site theme — a code box reads
            as a code box either way. */}
        <textarea
          readOnly
          value={snippet}
          rows={2}
          onFocus={(e) => e.target.select()}
          className="w-full border border-border bg-[#0d0d0d] p-3 font-mono text-xs text-[#90e0ef]"
        />
        <button
          onClick={copy}
          className="self-start border border-border bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-ink shadow-none transition-transform duration-150 ease-out hover:bg-accent-soft active:scale-95"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
    </div>
  );
}
