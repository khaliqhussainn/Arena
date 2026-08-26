"use client";

import type { MatchWithProducts } from "@/lib/arena-state";
import type { VoteSide } from "@/types/database";
import { PayButton } from "./PayButton";

const VOTES_TO_WIN = 5;

function SideColumn({
  productId,
  matchId,
  name,
  pitch,
  url,
  votes,
  side,
  disabled,
  voting,
  votedSide,
  onVote,
  onPaid,
}: {
  productId: string;
  matchId: string;
  name: string;
  pitch: string;
  url: string;
  votes: number;
  side: VoteSide;
  disabled: boolean;
  voting: boolean;
  votedSide?: VoteSide;
  onVote: (side: VoteSide) => void;
  onPaid?: () => void;
}) {
  const pct = Math.min(100, (votes / VOTES_TO_WIN) * 100);
  const isMyVote = votedSide === side;

  let label = "Vote";
  if (isMyVote) label = "Voted";
  else if (voting) label = "Voting…";
  else if (disabled) label = "Voted";

  return (
    <div className="flex flex-1 flex-col gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-display text-lg font-semibold text-ink hover:text-accent"
      >
        {name}
      </a>
      <p className="min-h-[2.5em] text-sm text-muted">{pitch}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-muted">{votes}/{VOTES_TO_WIN}</span>
        <button
          onClick={() => onVote(side)}
          disabled={disabled || voting}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            isMyVote
              ? "bg-surface-2 text-muted"
              : "bg-ink text-bg hover:bg-accent hover:text-accent-ink disabled:opacity-40"
          }`}
        >
          {label}
        </button>
      </div>
      <PayButton type="boost" productId={productId} matchId={matchId} onPaid={onPaid} />
    </div>
  );
}

export function MatchCard({
  match,
  votedSide,
  voting = false,
  onVote,
  onPaid,
}: {
  match: MatchWithProducts;
  votedSide?: VoteSide;
  voting?: boolean;
  onVote: (matchId: string, side: VoteSide) => void;
  onPaid?: () => void;
}) {
  const disabled = votedSide !== undefined;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {match.category}
        </span>
      </div>
      <div className="flex flex-col items-stretch gap-4 sm:flex-row">
        <SideColumn
          productId={match.product_a.id}
          matchId={match.id}
          name={match.product_a.name}
          pitch={match.product_a.pitch}
          url={match.product_a.url}
          votes={match.votes_a}
          side="a"
          disabled={disabled}
          voting={voting}
          votedSide={votedSide}
          onVote={(side) => onVote(match.id, side)}
          onPaid={onPaid}
        />
        <div className="flex items-center justify-center font-display text-sm font-bold text-accent sm:justify-normal">
          VS
        </div>
        <SideColumn
          productId={match.product_b.id}
          matchId={match.id}
          name={match.product_b.name}
          pitch={match.product_b.pitch}
          url={match.product_b.url}
          votes={match.votes_b}
          side="b"
          disabled={disabled}
          voting={voting}
          votedSide={votedSide}
          onVote={(side) => onVote(match.id, side)}
          onPaid={onPaid}
        />
      </div>
    </div>
  );
}
