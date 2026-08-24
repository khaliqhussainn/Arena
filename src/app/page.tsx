export default function Home() {
  return (
    <main className="flex flex-col">
      <section
        className="relative flex flex-col items-center justify-center gap-6 px-6 py-28 text-center text-paper"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--bg2) 0%, var(--bg) 65%)",
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
      </section>

      <section className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <h2 className="font-display text-2xl text-ink">Phase 1: scaffold complete</h2>
        <p className="max-w-md text-sm text-muted">
          Next.js + Tailwind + Supabase are wired up with the design tokens
          above. Core arena UI (submission, matchups, voting, Hall of Fame)
          ships in Phase 2.
        </p>
      </section>
    </main>
  );
}
