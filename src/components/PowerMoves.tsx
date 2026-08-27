import { Zap, Heart, ShieldCheck } from "lucide-react";

const MOVES = [
  {
    icon: Zap,
    title: "Boost",
    price: "$5",
    body: "Add +2 votes instantly to your side in the current duel.",
  },
  {
    icon: Heart,
    title: "Revive",
    price: "$10",
    body: "Back to the arena! Reset your wins and fight again.",
  },
  {
    icon: ShieldCheck,
    title: "Defend the Throne",
    price: "$20",
    body: "Return as champion. Prove you're still the best.",
  },
];

export function PowerMoves() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {MOVES.map((move) => (
          <div
            key={move.title}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft/15 text-accent">
                <move.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-lg font-bold text-accent">{move.price}</span>
            </div>
            <h3 className="font-display text-base font-bold text-ink">{move.title}</h3>
            <p className="text-sm text-muted">{move.body}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted">
        All payments are one-time. No subscriptions. Available contextually on a live duel,
        an eliminated product, or a reigning champion below.
      </p>
    </div>
  );
}
