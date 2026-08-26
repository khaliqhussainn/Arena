export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center gap-4 px-6 py-32 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      <p className="text-sm text-muted">Loading the arena…</p>
    </main>
  );
}
