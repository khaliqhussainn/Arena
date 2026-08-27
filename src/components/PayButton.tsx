"use client";

import { useState } from "react";
import type { PaymentType } from "@/types/database";

const LABELS: Record<PaymentType, string> = {
  boost: "$5 BOOST (+2 VOTES)",
  revive: "$10 REVIVE",
  defend: "$20 DEFEND THE THRONE",
};

export function PayButton({
  type,
  productId,
  matchId,
  className,
  label,
  onPaid,
}: {
  type: PaymentType;
  productId: string;
  matchId?: string;
  className?: string;
  label?: string;
  onPaid?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, productId, matchId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }

      if (window.LemonSqueezy?.Url) {
        window.LemonSqueezy.Setup?.({
          eventHandler: (event) => {
            if (event.event === "Checkout.Success") {
              // Give the webhook a moment to land before refreshing.
              setTimeout(() => onPaid?.(), 1500);
            }
          },
        });
        window.LemonSqueezy.Url.Open(data.url);
      } else {
        // Overlay script hasn't loaded yet — fall back to a plain redirect.
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "rounded-none border border-border bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-ink shadow-none transition-transform duration-150 ease-out hover:bg-accent-soft active:scale-95 disabled:active:scale-100 disabled:opacity-50"
        }
      >
        {loading ? "STARTING CHECKOUT…" : (label ?? LABELS[type])}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
