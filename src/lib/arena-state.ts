import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Champion, Database, Match, Product } from "@/types/database";

export type MatchWithProducts = Match & { product_a: Product; product_b: Product };
export type ChampionWithProduct = Champion & { product: Product };

export interface ArenaState {
  matches: MatchWithProducts[];
  waiting: Product[];
  eliminated: Product[];
  champions: ChampionWithProduct[];
  activity: { id: string; text: string; created_at: string }[];
}

export async function getArenaState(
  supabase: SupabaseClient<Database>,
): Promise<ArenaState> {
  const [matchesRes, activeProductsRes, eliminatedRes, championsRes, activityRes] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
          "*, product_a:products!matches_product_a_id_fkey(*), product_b:products!matches_product_b_id_fkey(*)",
        )
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      supabase.from("products").select("*").eq("status", "active"),
      supabase
        .from("products")
        .select("*")
        .eq("status", "eliminated")
        .order("submitted_at", { ascending: false })
        .limit(50),
      supabase
        .from("champions")
        .select("*, product:products!champions_product_id_fkey(*)")
        .order("crowned_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const matches = (matchesRes.data ?? []) as unknown as MatchWithProducts[];

  const matchedIds = new Set<string>();
  for (const m of matches) {
    matchedIds.add(m.product_a_id);
    matchedIds.add(m.product_b_id);
  }
  const waiting = (activeProductsRes.data ?? []).filter((p) => !matchedIds.has(p.id));

  return {
    matches,
    waiting,
    eliminated: eliminatedRes.data ?? [],
    champions: (championsRes.data ?? []) as unknown as ChampionWithProduct[],
    activity: activityRes.data ?? [],
  };
}
