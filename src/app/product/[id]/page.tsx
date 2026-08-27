import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getProductDetail } from "@/lib/arena-state";
import { BadgeEmbed } from "@/components/BadgeEmbed";
import { CrownIcon } from "@/components/icons";
import { timeAgo } from "@/lib/format";
import type { ProductStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Active",
  eliminated: "Eliminated",
  champion: "Champion",
};

const STATUS_CLASS: Record<ProductStatus, string> = {
  active: "border border-border bg-accent-soft text-black",
  eliminated: "border border-danger bg-danger text-danger-ink",
  champion: "border border-border bg-accent text-accent-ink",
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
            className={`px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wide ${STATUS_CLASS[product.status]}`}
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
        <div className="border border-border bg-surface p-5">
          <div className="flex items-center gap-2 text-sm text-ink">
            <CrownIcon className="h-5 w-5 shrink-0 text-accent" />
            <p>
              Crowned Champion {timeAgo(champion.crowned_at)}
              {champion.times_defended > 0
                ? `, defended the throne ${champion.times_defended}×`
                : ""}
              {product.status !== "champion" ? " (no longer reigning)" : ""}
            </p>
          </div>
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
          <ul className="flex flex-col divide-y divide-border border border-border bg-surface">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 font-mono text-sm">
                <span className={h.won ? "text-black" : "text-ink"}>
                  <span
                    className={
                      h.won
                        ? "bg-accent-soft px-1.5 py-0.5 font-bold text-black"
                        : "bg-surface-2 px-1.5 py-0.5 font-bold text-muted"
                    }
                  >
                    {h.won ? "BEAT" : "LOST TO"}
                  </span>{" "}
                  <span className="text-ink">
                    {h.opponentName} [{h.scoreFor}-{h.scoreAgainst}]
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(h.resolvedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
