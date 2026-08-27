import { Sword, Shield, Crosshair } from "lucide-react";

/**
 * Minimal, slow-moving combat-flavored background elements for the hero.
 * Pure CSS (transform/opacity) animations — no JS, no particle library,
 * kept low-opacity so it never competes with foreground content.
 */
export function ArenaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Sword
        className="absolute left-[8%] top-[18%] h-16 w-16 text-ink opacity-[0.05]"
        style={{ animation: "drift-slow 14s ease-in-out infinite" }}
      />
      <Shield
        className="absolute right-[10%] top-[12%] h-20 w-20 text-accent opacity-[0.07]"
        style={{ animation: "drift-slow-reverse 18s ease-in-out infinite" }}
      />
      <Crosshair
        className="absolute left-[20%] bottom-[15%] h-10 w-10 text-ink opacity-[0.06]"
        style={{ animation: "drift-slow 10s ease-in-out infinite" }}
      />
      <Sword
        className="absolute right-[18%] bottom-[10%] h-12 w-12 -rotate-45 text-accent opacity-[0.05]"
        style={{ animation: "drift-slow-reverse 16s ease-in-out infinite" }}
      />
      <div
        className="absolute left-[45%] top-[25%] h-1.5 w-1.5 rounded-full bg-accent"
        style={{ animation: "spark-pulse 4s ease-in-out infinite" }}
      />
      <div
        className="absolute right-[30%] top-[55%] h-1 w-1 rounded-full bg-accent-soft"
        style={{ animation: "spark-pulse 5s ease-in-out infinite 1s" }}
      />
      <div
        className="absolute left-[65%] bottom-[30%] h-1 w-1 rounded-full bg-accent"
        style={{ animation: "spark-pulse 6s ease-in-out infinite 2s" }}
      />
    </div>
  );
}
