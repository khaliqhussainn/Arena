## The Arena

Product battle platform: submit a product for free, get auto-paired head-to-head
against another product in your category, first to 5 votes wins. Win 3 duels in a
row and become the category's permanent Champion.

### Stack

- Next.js 14+ (App Router), TypeScript
- Supabase (Postgres) — data + vote-locking
- LemonSqueezy — payments for boost / revive / defend-the-throne
- Tailwind CSS

### Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**

   - Go to [supabase.com](https://supabase.com) → New project (free tier).
   - In the SQL editor, run `supabase/migrations/0001_init.sql` — this creates
     all six tables (`products`, `matches`, `votes`, `champions`,
     `activity_log`, `payments`) with the constraints, indexes, and RLS
     policies the app relies on (anon clients get read-only access to
     `products`/`matches`/`champions`/`activity_log`; `votes` and `payments`
     are only reachable server-side via the service role key).
   - Grab your Project URL, `anon` public key, and `service_role` secret key
     from Project Settings → API.

3. **Create a LemonSqueezy store** (needed starting Phase 3, can skip for now)

   - Go to [lemonsqueezy.com](https://lemonsqueezy.com) → create a store.
   - Create three products/variants: Boost ($5), Revive ($10), Defend the
     Throne ($20). Note each variant ID.
   - Grab your API key and Store ID from Settings → API.
   - You'll create a webhook (Settings → Webhooks) pointed at
     `<your-deployed-url>/api/webhooks/lemonsqueezy` once that route exists —
     note the signing secret.

4. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the values from steps 2–3. See `.env.local.example` for the full
   list of variable names.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Project structure

```
src/
  app/                 # Next.js App Router pages & route handlers
  lib/supabase/
    client.ts          # anon-key client (read-only, RLS-enforced)
    admin.ts            # service-role client (server-only, bypasses RLS)
  types/database.ts     # shared TS types matching the Postgres schema
supabase/
  migrations/0001_init.sql
```

### Build status

- **Phase 1 (done):** project scaffold, Supabase schema/migrations, env setup.
- **Phase 2:** core arena UI — submission, matchups, voting with real
  vote-locking, eliminated list, Hall of Fame, activity feed.
- **Phase 3:** LemonSqueezy checkout + webhook-gated boost/revive/defend.
- **Phase 4:** public product pages + embeddable champion badge.
- **Phase 5:** polish — mobile, empty/loading states, anti-spam.
