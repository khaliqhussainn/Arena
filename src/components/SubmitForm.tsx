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
  const [website, setWebsite] = useState(""); // honeypot — real users never see or fill this
  const [renderedAt] = useState(() => Date.now());
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
        body: JSON.stringify({ name, url, category, pitch, website, renderedAt }),
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
      className="mx-auto flex w-full max-w-xl flex-col gap-3 border border-border bg-surface p-6 text-left"
    >
      {/* Honeypot: hidden from real users, invisible to screen readers, but
          present in the DOM for bots that blindly fill every field. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          maxLength={80}
          required
          className="border border-border bg-bg px-3 py-2 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="border border-border bg-bg px-3 py-2 text-ink focus:border-accent focus:outline-none"
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
        className="border border-border bg-bg px-3 py-2 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <input
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="One-line pitch (what does it do?)"
        maxLength={140}
        required
        className="border border-border bg-bg px-3 py-2 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && (
        <p className="text-sm text-ink">
          You&apos;re in the arena. Watch for your first duel below.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 border border-border bg-accent px-4 py-2 font-display font-bold uppercase tracking-wide text-accent-ink shadow-none transition-transform duration-150 ease-out hover:bg-accent-soft active:scale-95 disabled:active:scale-100 disabled:opacity-60"
      >
        {submitting ? "Entering the arena…" : "Enter the arena — it's free"}
      </button>
    </form>
  );
}
