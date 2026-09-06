-- Fixes the win/leaderboard logic so a product can only ever earn a win by
-- actually completing a head-to-head duel through votes.
--
-- Previously, `autoAdvanceStaleWaitingProducts` granted a real win (and
-- streak increment) to any product that sat alone in its category pool for
-- 24h with no rival — that's how MochiMoney, Corpus, and bidnoww ended up
-- with a "1 win" they never earned through an actual duel. That logic is
-- removed in code; this migration adds the new 'unique' product status it
-- relies on and corrects any wins/streaks/champion crownings that were
-- awarded uncontested in the past.

-- ---------------------------------------------------------------------------
-- 1. Allow the new 'unique' status: a product that waited 7 days with no
--    rival. It is NOT a win, NOT on the leaderboard, but stays challengeable
--    and re-enters normal pairing the moment a rival becomes available.
-- ---------------------------------------------------------------------------
alter table products drop constraint if exists products_status_check;
alter table products add constraint products_status_check
  check (status in ('active', 'eliminated', 'champion', 'unique'));

-- ---------------------------------------------------------------------------
-- 2. Data correction: strip out any wins/streak that were only awarded
--    because a product had no rival, not because it won a duel through
--    votes. `uncontested_wins` has always tracked exactly how many of a
--    product's `wins` came from that path, so subtracting it out recovers
--    the count of genuinely-earned wins.
-- ---------------------------------------------------------------------------
create temporary table uncontested_correction as
select id, greatest(wins - uncontested_wins, 0) as new_wins
from products
where uncontested_wins > 0;

-- A champion crowned only by riding out uncontested wins to 3 was never a
-- real champion — remove that crowning if the corrected win count no longer
-- clears the threshold.
delete from champions
where product_id in (
  select c.id from uncontested_correction c
  join products p on p.id = c.id
  where p.status = 'champion' and c.new_wins < 3
);

update products p
set
  wins = c.new_wins,
  uncontested_wins = 0,
  status = case when p.status = 'champion' and c.new_wins < 3 then 'active' else p.status end,
  is_defending = case when p.status = 'champion' and c.new_wins < 3 then false else p.is_defending end,
  pool_entered_at = case when p.status = 'champion' and c.new_wins < 3 then now() else p.pool_entered_at end
from uncontested_correction c
where p.id = c.id;

drop table uncontested_correction;
