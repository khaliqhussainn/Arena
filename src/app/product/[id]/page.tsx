import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getProductDetail } from "@/lib/arena-state";
import { BadgeEmbed } from "@/components/BadgeEmbed";
import { timeAgo } from "@/lib/format";
import type { ProductStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Active",
  eliminated: "Eliminated",
  champion: "Champion",
};

const STATUS_CLASS: Record<ProductStatus, string> = {
  active: "bg-accent-soft/20 text-accent",
  eliminated: "bg-danger-soft text-danger",
  champion: "bg-accent text-accent-ink",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();
  const detail = await getProductDetail(admin, id);
  if (!detail) notFound();

  const { product, champion, history } = detail;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-16">
      <Link href="/" className="text-sm text-muted hover:text-accent">
        ← Back to the Arena
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-ink">{product.name}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[product.status]}`}
          >
            {STATUS_LABEL[product.status]}
          </span>
        </div>
        <p className="text-muted">{product.pitch}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-accent hover:underline"
          >
            {product.url}
          </a>
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            {product.category}
          </span>
        </div>
      </div>

      {champion && (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft/10 p-5">
          <p className="text-sm text-ink">
            👑 Crowned Champion {timeAgo(champion.crowned_at)}
            {champion.times_defended > 0
              ? `, defended the throne ${champion.times_defended}×`
              : ""}
            {product.status !== "champion" ? " (no longer reigning)" : ""}
          </p>
          {product.status === "champion" && (
            <BadgeEmbed
              badgeUrl={`${siteUrl}/api/badge/${product.id}`}
              productUrl={`${siteUrl}/product/${product.id}`}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">Duel history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No duels yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-ink">
                  <span className={h.won ? "text-accent" : "text-danger"}>
                    {h.won ? "Won" : "Lost"}
                  </span>{" "}
                  vs {h.opponentName}
                </span>
                <span className="font-mono text-sm text-muted">
                  {h.scoreFor}-{h.scoreAgainst}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
