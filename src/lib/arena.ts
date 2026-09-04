import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Database, Match, Product } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

const WINS_TO_CHAMPION = 3;
const VOTES_TO_WIN = 100;
const UNCONTESTED_ADVANCE_MS = 24 * 60 * 60 * 1000;

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
 * Grants a win to `winner`: advances their streak, crowns them Champion at
 * 3 in a row, or — if not yet a champion — leaves them active and resets
 * their pool clock so a fresh 24h uncontested-advance window starts. Shared
 * by real match resolution and the uncontested-advance path below; the
 * `uncontested` flag only affects bookkeeping (activity copy, the
 * `uncontested_wins` counter) never the win-counting rule itself.
 */
async function applyWin(
  admin: AdminClient,
  winner: Product,
  category: Category,
  opts: { uncontested: boolean; loser?: Product; votesLine?: string },
) {
  const newWins = winner.wins + 1;
  const newUncontested = winner.uncontested_wins + (opts.uncontested ? 1 : 0);

  if (newWins >= WINS_TO_CHAMPION) {
    await admin
      .from("products")
      .update({
        status: "champion",
        wins: newWins,
        uncontested_wins: newUncontested,
        is_defending: false,
      })
      .eq("id", winner.id);

    const suffix = opts.uncontested ? " (advanced uncontested)" : "";
    const line = opts.loser
      ? `beating ${opts.loser.name} ${opts.votesLine}`
      : "after no challenger appeared";

    if (winner.is_defending) {
      // Extending an existing reign, not a fresh crowning.
      const { data: existing } = await admin
        .from("champions")
        .select("*")
        .eq("product_id", winner.id)
        .order("crowned_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        await admin
          .from("champions")
          .update({ times_defended: existing.times_defended + 1 })
          .eq("id", existing.id);
      }
      await logActivity(
        admin,
        `🛡️ ${winner.name} has successfully defended the throne in ${category}, ${line}${suffix}!`,
      );
    } else {
      await admin.from("champions").insert({
        product_id: winner.id,
        category,
        times_defended: 0,
      });
      await logActivity(
        admin,
        `🏆 ${winner.name} has been crowned Champion of ${category}, ${line}${suffix}!`,
      );
    }
  } else {
    await admin
      .from("products")
      .update({
        wins: newWins,
        uncontested_wins: newUncontested,
        pool_entered_at: new Date().toISOString(),
      })
      .eq("id", winner.id);
    if (opts.uncontested) {
      await logActivity(
        admin,
        `🎖️ ${winner.name} advances uncontested in ${category} after 24h with no challenger (win streak: ${newWins})`,
      );
    } else {
      await logActivity(
        admin,
        `${winner.name} beat ${opts.loser?.name} ${opts.votesLine} in ${category} (win streak: ${newWins})`,
      );
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

  await admin
    .from("products")
    .update({ status: "eliminated", wins: 0, is_defending: false })
    .eq("id", loser.id);
  await logActivity(admin, `${loser.name} has been eliminated`);

  const votesLine = `${Math.max(match.votes_a, match.votes_b)}-${Math.min(match.votes_a, match.votes_b)}`;
  await applyWin(admin, winner, match.category, { uncontested: false, loser, votesLine });

  await pairUnmatchedProducts(admin, match.category);
}

/**
 * Auto-advances any product that has sat alone in its category's pool for
 * 24h+ with no challenger. There's no cron here — this runs lazily on every
 * arena state fetch (page load + the client's poll), which is frequent
 * enough that the 24h mark is crossed within seconds of the deadline in
 * practice, without needing any scheduled-job infra.
 */
export async function autoAdvanceStaleWaitingProducts(admin: AdminClient) {
  const cutoff = new Date(Date.now() - UNCONTESTED_ADVANCE_MS).toISOString();

  const [{ data: staleActive }, { data: activeMatches }] = await Promise.all([
    admin
      .from("products")
      .select("*")
      .eq("status", "active")
      .lte("pool_entered_at", cutoff)
      .order("pool_entered_at", { ascending: true }),
    admin.from("matches").select("product_a_id, product_b_id").eq("status", "active"),
  ]);

  if (!staleActive || staleActive.length === 0) return;

  const matchedIds = new Set<string>();
  for (const m of activeMatches ?? []) {
    matchedIds.add(m.product_a_id);
    matchedIds.add(m.product_b_id);
  }

  const touchedCategories = new Set<Category>();

  for (const product of staleActive) {
    if (matchedIds.has(product.id)) continue; // shouldn't happen, but never advance a matched product
    await applyWin(admin, product, product.category, { uncontested: true });
    touchedCategories.add(product.category);
  }

  for (const category of touchedCategories) {
    await pairUnmatchedProducts(admin, category);
  }
}

/**
 * Paid action effects. Each is only ever invoked from the LemonSqueezy
 * webhook handler after payment is confirmed — never directly from a
 * client request.
 */

export async function applyRevive(admin: AdminClient, product: Product) {
  // Conditional on still being eliminated: guards against a delayed/retried
  // webhook re-applying after the product's state has already moved on.
  const { data: updated } = await admin
    .from("products")
    .update({
      status: "active",
      wins: 0,
      is_defending: false,
      pool_entered_at: new Date().toISOString(),
    })
    .eq("id", product.id)
    .eq("status", "eliminated")
    .select()
    .maybeSingle();
  if (!updated) return;

  await logActivity(
    admin,
    `💊 ${product.name} has been revived and re-enters the arena in ${product.category}`,
  );
  await pairUnmatchedProducts(admin, product.category);
}

export async function applyDefend(admin: AdminClient, product: Product) {
  // Conditional on still being a non-defending champion: same delayed-
  // webhook guard as applyRevive.
  const { data: updated } = await admin
    .from("products")
    .update({
      status: "active",
      wins: 0,
      is_defending: true,
      pool_entered_at: new Date().toISOString(),
    })
    .eq("id", product.id)
    .eq("status", "champion")
    .eq("is_defending", false)
    .select()
    .maybeSingle();
  if (!updated) return;

  await logActivity(
    admin,
    `🛡️ ${product.name} steps back into the arena to defend the throne in ${product.category}`,
  );
  await pairUnmatchedProducts(admin, product.category);
}

const BOOST_VOTES = 2;

export async function applyBoost(admin: AdminClient, matchId: string, productId: string) {
  const { data: match } = await admin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("status", "active")
    .maybeSingle();
  if (!match) return; // the duel already ended before payment confirmed — nothing to apply

  const side = match.product_a_id === productId ? "a" : match.product_b_id === productId ? "b" : null;
  if (!side) return;

  const { data: boosted } = await admin.rpc("boost_votes", {
    p_match_id: matchId,
    p_side: side,
    p_amount: BOOST_VOTES,
  });

  const { data: product } = await admin.from("products").select("*").eq("id", productId).maybeSingle();
  if (product) {
    await logActivity(admin, `⚡ ${product.name} got boosted +${BOOST_VOTES} votes in ${match.category}`);
  }

  if (boosted) await resolveMatchIfComplete(admin, boosted);
}
