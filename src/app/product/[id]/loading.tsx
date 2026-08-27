export default function ProductLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="h-4 w-32 animate-pulse rounded-md bg-surface-2" />
      <div className="flex flex-col gap-3">
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-full animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-1/3 animate-pulse rounded-md bg-surface-2" />
      </div>
      <div className="h-24 w-full animate-pulse rounded-xl border border-border bg-surface-2" />
      <div className="h-40 w-full animate-pulse rounded-xl border border-border bg-surface-2" />
    </main>
  );
}
