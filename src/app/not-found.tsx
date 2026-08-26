import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center gap-4 px-6 py-32 text-center">
      <span className="text-3xl">🔍</span>
      <h1 className="font-display text-2xl font-semibold text-ink">Nothing here</h1>
      <p className="max-w-sm text-sm text-muted">
        This product or page doesn&apos;t exist — maybe it was never submitted, or the
        link is off.
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-accent-soft"
      >
        Back to the Arena
      </Link>
    </main>
  );
}
