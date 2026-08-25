"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ArenaState } from "@/lib/arena-state";
import { CATEGORIES, type Category, type Product, type VoteSide } from "@/types/database";
import { SubmitForm } from "./SubmitForm";
import { CategoryTabs, type TabValue } from "./CategoryTabs";
import { MatchCard } from "./MatchCard";
import { HallOfFame } from "./HallOfFame";
import { EliminatedList } from "./EliminatedList";
import { ActivityFeed } from "./ActivityFeed";
import { WaitingCard } from "./WaitingCard";

const POLL_MS = 5000;
const VOTED_STORAGE_KEY = "arena_voted_matches";

function loadVotedMap(): Record<string, VoteSide> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(VOTED_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function ArenaApp({ initialState }: { initialState: ArenaState }) {
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState<TabValue>("All");
  const [votedMap, setVotedMap] = useState<Record<string, VoteSide>>({});
  const [pendingVotes, setPendingVotes] = useState<Set<string>>(new Set());
  const [voteError, setVoteError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<{ category: Category; from: string } | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    // Hydrate from localStorage after mount (not in the lazy useState
    // initializer) so the client's first render matches the server's
    // window-less render, avoiding a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVotedMap(loadVotedMap());

    const params = new URLSearchParams(window.location.search);
    const joinCategory = params.get("join");
    const from = params.get("from");
    if (joinCategory && (CATEGORIES as readonly string[]).includes(joinCategory)) {
      setTab(joinCategory as Category);
      setChallenge({ category: joinCategory as Category, from: from || "A founder" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      if (inFlight.current) return;
      try {
        const res = await fetch("/api/state");
        if (res.ok) setState(await res.json());
      } catch {
        // best-effort poll; ignore transient network errors
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  function markVoted(matchId: string, side: VoteSide) {
    setVotedMap((prev) => {
      const next = { ...prev, [matchId]: side };
      window.localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function castVote(matchId: string, side: VoteSide) {
    if (votedMap[matchId] || pendingVotes.has(matchId)) return;
    setVoteError(null);
    setPendingVotes((prev) => new Set(prev).add(matchId));
    inFlight.current = true;
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, side }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoteError(data.error ?? "Could not cast vote.");
        // A 409 means a vote under this fingerprint already exists for this
        // match — lock the button locally too. Any other failure (rate
        // limit, network hiccup, resolved match) leaves it retryable.
        if (res.status === 409) markVoted(matchId, side);
        return;
      }
      markVoted(matchId, side);
      if (data.state) setState(data.state);
    } catch {
      setVoteError("Network error — please try again.");
    } finally {
      inFlight.current = false;
      setPendingVotes((prev) => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  }

  function handleSubmitted(product: Product, freshState: ArenaState) {
    setState(freshState);
    setTab(product.category);
  }

  const filtered = useMemo(() => {
    const inCategory = <T extends { category: string }>(items: T[]) =>
      tab === "All" ? items : items.filter((i) => i.category === tab);
    return {
      matches: inCategory(state.matches),
      waiting: inCategory(state.waiting),
      eliminated: inCategory(state.eliminated),
      champions: inCategory(state.champions),
    };
  }, [state, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: state.matches.length };
    for (const m of state.matches) c[m.category] = (c[m.category] ?? 0) + 1;
    return c;
  }, [state.matches]);

  return (
    <main className="flex flex-col">
      <section
        className="relative flex flex-col items-center justify-center gap-8 px-6 py-24 text-center text-paper"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, var(--bg2) 0%, var(--bg) 65%)",
        }}
      >
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold-soft">
          The Arena
        </span>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
          Win three duels. <span className="text-gold">Become champion.</span>
        </h1>
        <p className="max-w-xl text-muted">
          Submit your product for free. Get paired head-to-head against another
          product in your category. First to 5 votes wins.
        </p>
        <SubmitForm onSubmitted={handleSubmitted} />
      </section>

      <section className="flex flex-col gap-10 px-6 py-12 md:px-10 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-10">
          {challenge && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gold bg-gold/10 px-5 py-3">
              <p className="text-sm text-ink">
                👋 <strong>{challenge.from}</strong> is waiting for a challenger in{" "}
                <strong>{challenge.category}</strong>. Submit your product above to start the
                duel!
              </p>
              <button
                onClick={() => setChallenge(null)}
                className="shrink-0 text-sm text-muted hover:text-ink"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <CategoryTabs selected={tab} onSelect={setTab} counts={counts} />
            {voteError && <p className="text-sm text-crimson">{voteError}</p>}
          </div>

          {filtered.waiting.length > 0 && (
            <div className="flex flex-col gap-3">
              {filtered.waiting.map((p) => (
                <WaitingCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">Live duels</h2>
            {filtered.matches.length === 0 ? (
              <p className="text-sm text-muted">
                No active duels{tab !== "All" ? ` in ${tab}` : ""} right now. Submit a
                product to start one.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    votedSide={votedMap[m.id]}
                    voting={pendingVotes.has(m.id)}
                    onVote={castVote}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">Hall of Fame</h2>
            <HallOfFame champions={filtered.champions} />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">Eliminated</h2>
            <EliminatedList products={filtered.eliminated} />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <h2 className="font-display text-xl font-semibold text-ink">Activity</h2>
          <ActivityFeed activity={state.activity} />
        </aside>
      </section>
    </main>
  );
}
