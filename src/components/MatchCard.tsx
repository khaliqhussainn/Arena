"use client";

import type { MatchWithProducts } from "@/lib/arena-state";
import type { VoteSide } from "@/types/database";
import { PayButton } from "./PayButton";

const VOTES_TO_WIN = 5;
const NEAR_LOSS_THRESHOLD = VOTES_TO_WIN - 1;

function SideColumn({
  productId,
  matchId,
  name,
  pitch,
  url,
  votes,
  side,
  nearLoss,
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
  nearLoss: boolean;
  disabled: boolean;
  voting: boolean;
  votedSide?: VoteSide;
  onVote: (side: VoteSide) => void;
  onPaid?: () => void;
}) {
  const isMyVote = votedSide === side;

  let label = "VOTE";
  if (isMyVote) label = "VOTED";
  else if (voting) label = "VOTING…";
  else if (disabled) label = "VOTED";

  return (
    <div
      className={`flex flex-1 flex-col gap-2 p-3 ${nearLoss ? "border border-danger" : "border border-transparent"}`}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-display text-lg font-semibold text-ink hover:text-accent"
      >
        {name}
      </a>
      <p className="min-h-[2.5em] text-sm text-muted">{pitch}</p>
      <div className="flex items-baseline justify-between">
        <span key={votes} className="font-mono text-lg font-bold text-ink [animation:slide-up-pop_150ms_ease-out]">
          {votes}
          <span className="text-sm font-normal text-muted">/{VOTES_TO_WIN}</span>
        </span>
        <button
          onClick={() => onVote(side)}
          disabled={disabled || voting}
          className={`rounded-none px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-transform duration-150 ease-out active:scale-95 disabled:active:scale-100 ${
            isMyVote
              ? "border border-border bg-surface-2 text-muted"
              : "bg-accent text-accent-ink shadow-none hover:bg-accent-soft disabled:opacity-40"
          }`}
        >
          {label}
        </button>
      </div>

      {nearLoss ? (
        <PayButton
          type="boost"
          productId={productId}
          matchId={matchId}
          onPaid={onPaid}
          className="rounded-none border border-danger bg-danger px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-danger-ink shadow-none transition-transform duration-150 ease-out hover:bg-danger active:scale-95"
          label="⚠ $5 BOOST (+2 VOTES)"
        />
      ) : (
        <PayButton type="boost" productId={productId} matchId={matchId} onPaid={onPaid} />
      )}
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
  const total = match.votes_a + match.votes_b;
  const aPct = total === 0 ? 50 : (match.votes_a / total) * 100;

  const aNearLoss = match.votes_b === NEAR_LOSS_THRESHOLD && match.votes_a < VOTES_TO_WIN;
  const bNearLoss = match.votes_a === NEAR_LOSS_THRESHOLD && match.votes_b < VOTES_TO_WIN;

  return (
    <div className="flex flex-col gap-3 border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {match.category}
        </span>
      </div>

      {/* Tug-of-war bar: proportion of votes cast so far, not progress to 5 —
          the per-side counters below carry the race-to-5 mechanic. */}
      <div className="flex h-1 w-full overflow-hidden bg-surface-2">
        <div className="h-full bg-accent transition-all duration-150 ease-out" style={{ width: `${aPct}%` }} />
        <div
          className="h-full bg-accent-soft transition-all duration-150 ease-out"
          style={{ width: `${100 - aPct}%` }}
        />
      </div>

      <div className="flex flex-col items-stretch divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
        <SideColumn
          productId={match.product_a.id}
          matchId={match.id}
          name={match.product_a.name}
          pitch={match.product_a.pitch}
          url={match.product_a.url}
          votes={match.votes_a}
          side="a"
          nearLoss={aNearLoss}
          disabled={disabled}
          voting={voting}
          votedSide={votedSide}
          onVote={(side) => onVote(match.id, side)}
          onPaid={onPaid}
        />
        <div className="flex items-center justify-center py-2 sm:py-0">
          <span className="border border-border bg-accent px-2 py-0.5 font-display text-xs font-bold text-accent-ink">
            VS
          </span>
        </div>
        <SideColumn
          productId={match.product_b.id}
          matchId={match.id}
          name={match.product_b.name}
          pitch={match.product_b.pitch}
          url={match.product_b.url}
          votes={match.votes_b}
          side="b"
          nearLoss={bNearLoss}
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
