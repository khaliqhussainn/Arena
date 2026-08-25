-- Support for lone-in-category products: an invite link to recruit a
-- challenger, and an "uncontested win" auto-advance after 24h of no
-- opponent showing up.

alter table products
  add column pool_entered_at timestamptz not null default now(),
  add column uncontested_wins int not null default 0;

-- Backfill existing rows so pool_entered_at reflects when they were last
-- known to be waiting (best guess: submission time).
update products set pool_entered_at = submitted_at;

create index products_pool_entered_at_idx on products (pool_entered_at)
  where status = 'active';
