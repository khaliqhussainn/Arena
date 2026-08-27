"use client";

import type { MatchWithProducts } from "@/lib/arena-state";
import type { VoteSide } from "@/types/database";
import { PayButton } from "./PayButton";
import { ProductAvatar } from "./ProductAvatar";
import { ShareButtons } from "./ShareButtons";

const VOTES_TO_WIN = 5;
const NEAR_LOSS_THRESHOLD = VOTES_TO_WIN - 1;

function SideCard({
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
  const pct = Math.min(100, (votes / VOTES_TO_WIN) * 100);

  let label = "Vote";
  if (isMyVote) label = "Voted for this side";
  else if (voting) label = "Voting…";
  else if (disabled) label = "Voted";

  return (
    <div
      className={`flex flex-1 flex-col gap-3 p-4 transition-shadow duration-150 sm:p-5 ${
        nearLoss ? "rounded-xl ring-1 ring-danger/60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <ProductAvatar name={name} accent={isMyVote} />
        <div className="flex min-w-0 flex-col">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="truncate font-display text-base font-bold text-ink hover:text-accent sm:text-lg"
          >
            {name}
          </a>
          <p className="hidden truncate text-xs text-muted sm:block">{pitch}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span key={votes} className="font-mono text-2xl font-bold text-ink [animation:slide-up-pop_150ms_ease-out]">
            {votes}
          </span>
          <span className="font-mono text-xs text-muted">of {VOTES_TO_WIN} votes</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => onVote(side)}
        disabled={disabled || voting}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 ease-out active:scale-95 disabled:active:scale-100 ${
          isMyVote
            ? "border border-border bg-surface-2 text-muted shadow-none"
            : "bg-accent text-accent-ink hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40"
        }`}
      >
        {label}
      </button>

      {nearLoss ? (
        <PayButton
          type="boost"
          productId={productId}
          matchId={matchId}
          onPaid={onPaid}
          label="Boost +2 votes ($5) — one from elimination"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-xs font-semibold text-danger shadow-none transition-all duration-150 ease-out hover:bg-danger hover:text-danger-ink active:scale-95"
        />
      ) : (
        <PayButton
          type="boost"
          productId={productId}
          matchId={matchId}
          onPaid={onPaid}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft/10 px-3 py-2 text-xs font-semibold text-accent shadow-none transition-all duration-150 ease-out hover:bg-accent-soft/20 active:scale-95"
        />
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
  const aNearLoss = match.votes_b === NEAR_LOSS_THRESHOLD && match.votes_a < VOTES_TO_WIN;
  const bNearLoss = match.votes_a === NEAR_LOSS_THRESHOLD && match.votes_b < VOTES_TO_WIN;

  const shareText = `${match.product_a.name} vs ${match.product_b.name} is heating up in ${match.category} on The Arena — cast your vote!`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?join=${encodeURIComponent(match.category)}`
      : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-md transition-shadow duration-150 ease-out hover:shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent-soft/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
            {match.category}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Live
          </span>
        </div>
        <ShareButtons url={shareUrl} text={shareText} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-[1fr_auto_1fr] sm:divide-y-0 sm:divide-x">
        <SideCard
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
        <div className="flex items-center justify-center px-3 py-2 sm:py-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent bg-accent-soft/15 font-display text-xs font-bold text-accent shadow-sm">
            VS
          </span>
        </div>
        <SideCard
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
      {disabled && (
        <p className="border-t border-border px-4 py-2 text-center text-xs text-muted sm:px-5">
          You can only vote once per duel
        </p>
      )}
    </div>
  );
}
