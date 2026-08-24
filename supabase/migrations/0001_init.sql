-- The Arena — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  pitch text not null,
  category text not null check (category in (
    'General', 'AI Tools', 'Dev Tools', 'Design', 'Marketing', 'Productivity', 'Other'
  )),
  status text not null default 'active' check (status in ('active', 'eliminated', 'champion')),
  wins int not null default 0,
  is_defending boolean not null default false,
  submitted_at timestamptz not null default now()
);

create index products_category_status_idx on products (category, status);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table matches (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  product_a_id uuid not null references products (id) on delete cascade,
  product_b_id uuid not null references products (id) on delete cascade,
  votes_a int not null default 0,
  votes_b int not null default 0,
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint matches_distinct_products check (product_a_id <> product_b_id)
);

create index matches_category_status_idx on matches (category, status);

-- ---------------------------------------------------------------------------
-- votes
-- ---------------------------------------------------------------------------
create table votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  voter_fingerprint text not null,
  side text not null check (side in ('a', 'b')),
  created_at timestamptz not null default now(),
  unique (match_id, voter_fingerprint)
);

create index votes_match_id_idx on votes (match_id);

-- ---------------------------------------------------------------------------
-- champions
-- ---------------------------------------------------------------------------
create table champions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  category text not null,
  crowned_at timestamptz not null default now(),
  times_defended int not null default 0
);

create index champions_category_idx on champions (category);

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx on activity_log (created_at desc);

-- ---------------------------------------------------------------------------
-- payments — source of truth for granting paid actions after webhook confirmation
-- ---------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  lemonsqueezy_order_id text,
  product_id uuid references products (id) on delete set null,
  match_id uuid references matches (id) on delete set null,
  type text not null check (type in ('boost', 'revive', 'defend')),
  amount numeric,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- Idempotency: a given LemonSqueezy order can only be recorded once.
create unique index payments_ls_order_id_unique_idx
  on payments (lemonsqueezy_order_id)
  where lemonsqueezy_order_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- All mutations happen through server-side route handlers using the
-- Supabase service role key (which bypasses RLS entirely). Anonymous
-- clients only ever get read access to the public tables below — they
-- can never insert/update/delete anything directly, and they can never
-- read votes or payments.
-- ---------------------------------------------------------------------------
alter table products enable row level security;
alter table matches enable row level security;
alter table votes enable row level security;
alter table champions enable row level security;
alter table activity_log enable row level security;
alter table payments enable row level security;

create policy "public read products" on products for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read champions" on champions for select using (true);
create policy "public read activity_log" on activity_log for select using (true);

-- No policies on votes or payments for anon/authenticated roles:
-- RLS with zero policies denies all access, so both tables are only
-- reachable via the service role key from server-side code.
