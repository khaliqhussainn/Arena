"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

export function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  function openIntent(intentUrl: string) {
    window.open(intentUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  const iconButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-md active:scale-95";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          openIntent(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
        }
        aria-label="Share on X"
        className={iconButtonClass}
      >
        <span className="text-sm font-bold">𝕏</span>
      </button>
      <button
        onClick={() =>
          openIntent(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
        }
        aria-label="Share on LinkedIn"
        className={iconButtonClass}
      >
        <span className="text-xs font-bold">in</span>
      </button>
      <button onClick={copyLink} aria-label="Copy link" className={iconButtonClass}>
        <Link2 className="h-4 w-4" />
      </button>
      {copied && <span className="text-xs text-muted">Copied!</span>}
    </div>
  );
}
