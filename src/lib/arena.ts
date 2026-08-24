import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Database, Match, Product } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

const WINS_TO_CHAMPION = 3;
const VOTES_TO_WIN = 5;

export async function logActivity(admin: AdminClient, text: string) {
  await admin.from("activity_log").insert({ text });
}

/**
 * Pairs up any active, currently-unmatched products within a category.
 * Runs after every submission and after every match resolution, so the
 * pool never sits idle with 2+ waiting products.
 */
export async function pairUnmatchedProducts(admin: AdminClient, category: Category) {
  const [{ data: activeProducts }, { data: activeMatches }] = await Promise.all([
    admin
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("status", "active")
      .order("submitted_at", { ascending: true }),
    admin
      .from("matches")
      .select("product_a_id, product_b_id")
      .eq("category", category)
      .eq("status", "active"),
  ]);

  const matchedIds = new Set<string>();
  for (const m of activeMatches ?? []) {
    matchedIds.add(m.product_a_id);
    matchedIds.add(m.product_b_id);
  }

  const waiting = (activeProducts ?? []).filter((p) => !matchedIds.has(p.id));

  while (waiting.length >= 2) {
    const a = waiting.shift() as Product;
    const b = waiting.shift() as Product;

    const { error } = await admin.from("matches").insert({
      category,
      product_a_id: a.id,
      product_b_id: b.id,
      votes_a: 0,
      votes_b: 0,
      status: "active",
    });

    if (!error) {
      await logActivity(admin, `⚔️ New duel in ${category}: ${a.name} vs ${b.name}`);
    }
  }
}

/**
 * Applies the outcome of a match once one side has reached the vote
 * threshold: records the win/elimination, crowns a champion at a 3-win
 * streak, and re-opens the pool for pairing. Safe to call more than once
 * for the same match — only the first caller to flip its status to
 * "resolved" does anything.
 */
export async function resolveMatchIfComplete(admin: AdminClient, match: Match) {
  if (match.votes_a < VOTES_TO_WIN && match.votes_b < VOTES_TO_WIN) return;

  const winnerSide = match.votes_a >= VOTES_TO_WIN ? "a" : "b";
  const winnerId = winnerSide === "a" ? match.product_a_id : match.product_b_id;
  const loserId = winnerSide === "a" ? match.product_b_id : match.product_a_id;

  const { data: resolved } = await admin
    .from("matches")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", match.id)
    .eq("status", "active")
    .select()
    .maybeSingle();

  // Another concurrent request already resolved this match — nothing to do.
  if (!resolved) return;

  const [{ data: winner }, { data: loser }] = await Promise.all([
    admin.from("products").select("*").eq("id", winnerId).single(),
    admin.from("products").select("*").eq("id", loserId).single(),
  ]);
  if (!winner || !loser) return;

  const newWins = winner.wins + 1;

  await admin.from("products").update({ status: "eliminated", wins: 0 }).eq("id", loser.id);

  if (newWins >= WINS_TO_CHAMPION) {
    await admin
      .from("products")
      .update({ status: "champion", wins: newWins, is_defending: false })
      .eq("id", winner.id);
    await admin.from("champions").insert({
      product_id: winner.id,
      category: match.category,
      times_defended: 0,
    });
    await logActivity(
      admin,
      `🏆 ${winner.name} has been crowned Champion of ${match.category}, beating ${loser.name} ${Math.max(match.votes_a, match.votes_b)}-${Math.min(match.votes_a, match.votes_b)}!`,
    );
  } else {
    await admin.from("products").update({ wins: newWins }).eq("id", winner.id);
    await logActivity(
      admin,
      `${winner.name} beat ${loser.name} ${Math.max(match.votes_a, match.votes_b)}-${Math.min(match.votes_a, match.votes_b)} in ${match.category} (win streak: ${newWins})`,
    );
  }

  await logActivity(admin, `${loser.name} has been eliminated`);

  await pairUnmatchedProducts(admin, match.category);
}
