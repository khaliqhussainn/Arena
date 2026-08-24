import { timeAgo } from "@/lib/format";

export function ActivityFeed({
  activity,
}: {
  activity: { id: string; text: string; created_at: string }[];
}) {
  if (activity.length === 0) {
    return <p className="text-sm text-muted">Nothing has happened yet. Be the first.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {activity.map((a) => (
        <li key={a.id} className="flex flex-col gap-0.5 border-b border-ink/10 pb-3 last:border-0">
          <span className="text-sm text-ink">{a.text}</span>
          <span className="font-mono text-xs text-muted">{timeAgo(a.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}
