"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type Product } from "@/types/database";
import type { ArenaState } from "@/lib/arena-state";

export function SubmitForm({
  onSubmitted,
}: {
  onSubmitted: (product: Product, state: ArenaState) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Category>("General");
  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, category, pitch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSubmitted(data.product as Product, data.state as ArenaState);
      setName("");
      setUrl("");
      setPitch("");
      setSuccess(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-bg2/80 p-6 text-left backdrop-blur"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          maxLength={80}
          required
          className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-paper placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-paper focus:border-gold focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://yourproduct.com"
        required
        className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-paper placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <input
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="One-line pitch (what does it do?)"
        maxLength={140}
        required
        className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-paper placeholder:text-muted focus:border-gold focus:outline-none"
      />

      {error && <p className="text-sm text-crimson">{error}</p>}
      {success && (
        <p className="text-sm text-gold-soft">
          You&apos;re in the arena. Watch for your first duel below.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-gold px-4 py-2 font-display font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-60"
      >
        {submitting ? "Entering the arena…" : "Enter the arena — it's free"}
      </button>
    </form>
  );
}
