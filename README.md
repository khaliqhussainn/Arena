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
   - In the SQL editor, run the files in `supabase/migrations/` in order:
     `0001_init.sql` creates all six tables (`products`, `matches`, `votes`,
     `champions`, `activity_log`, `payments`) with the constraints, indexes,
     and RLS policies the app relies on (anon clients get read-only access
     to `products`/`matches`/`champions`/`activity_log`; `votes` and
     `payments` are only reachable server-side via the service role key).
     `0002_functions.sql` adds `cast_vote(...)`, a Postgres function that
     atomically records a vote and increments the match's counter.
     `0003_uncontested.sql` adds the columns behind the waiting-for-a-
     challenger/uncontested-advance feature. `0004_boost.sql` adds
     `boost_votes(...)`, the same atomic-increment pattern for paid boosts.
   - Grab your Project URL, `anon` public key, and `service_role` secret key
     from Project Settings → API.

3. **Create a LemonSqueezy store**

   - Go to [lemonsqueezy.com](https://lemonsqueezy.com) → create a store.
   - Create three products/variants: Boost ($5), Revive ($10), Defend the
     Throne ($20). Each variant's ID is in its product settings page URL —
     these go in `LEMONSQUEEZY_BOOST_VARIANT_ID` /
     `LEMONSQUEEZY_REVIVE_VARIANT_ID` / `LEMONSQUEEZY_DEFEND_VARIANT_ID`.
   - Grab your API key (Settings → API) and Store ID (also Settings → API,
     or in the store switcher) for `LEMONSQUEEZY_API_KEY` /
     `LEMONSQUEEZY_STORE_ID`.
   - Once deployed, create a webhook at Settings → Webhooks pointed at
     `<your-deployed-url>/api/webhooks/lemonsqueezy`, subscribed to at least
     the `order_created` event. Paste the signing secret it gives you into
     `LEMONSQUEEZY_WEBHOOK_SECRET`.

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
- **Phase 2 (done):** core arena UI — submission, auto-pairing, matchups,
  voting with real vote-locking (DB unique constraint + signed visitor
  cookie), win-streak/elimination/champion-crowning logic, eliminated list,
  Hall of Fame, activity feed. State refreshes via a 5s poll of `/api/state`.
- **Phase 3 (done):** LemonSqueezy checkout + webhook-gated boost/revive/defend.
- **Phase 4 (done):** public product pages + embeddable champion badge.
- **Phase 5:** polish — mobile, empty/loading states, anti-spam.

### How voting/pairing works (Phase 2)

- Submitting is always free (`POST /api/products`) and immediately triggers
  pairing: any 2+ active, unmatched products in the same category are
  matched into a new duel.
- Voting (`POST /api/votes`) sets a signed, httpOnly `arena_vid` cookie on
  first vote and hashes it (with `FINGERPRINT_SALT`) before storing it — the
  DB's unique `(match_id, voter_fingerprint)` constraint is the real
  enforcement of "1 vote per visitor per duel," not just client-side UI
  state. A lightweight in-memory IP rate limiter also caps request bursts
  (best-effort only — resets on cold start, not shared across instances).
- Reaching 5 votes on a side resolves the match: the winner's streak
  increments (crowning a Champion at 3 in a row) and the loser is
  eliminated. The winner is then re-entered into the pairing pool unless
  they were just crowned.
- A product alone in its category (no one to pair against) is shown as
  "Waiting for a challenger" with a one-tap copyable invite link
  (`/?join=<category>&from=<name>`) that pre-selects that category and
  shows a banner when someone follows it — the intended growth loop for a
  lone early submitter. If still uncontested 24h after they last entered
  the pool, they auto-advance with a win (marked "uncontested" in the
  activity feed and, if it makes them Champion, noted honestly on their
  Hall of Fame card). There's no cron for this — it's checked lazily on
  every `/api/state` fetch, which the client already polls every 5s.

### How payments work (Phase 3)

- `POST /api/checkout` creates a LemonSqueezy checkout server-side (via
  their REST API, using `LEMONSQUEEZY_API_KEY`) and returns the hosted
  checkout URL. The client opens it in LemonSqueezy's overlay
  (`assets.lemonsqueezy.com/lemon.js`, loaded in the root layout). This
  route does an early, friendly legality check (is the match still active /
  is the product actually eliminated or a non-defending champion) but it
  **grants nothing** — it only starts a checkout.
- The product/match id and action type are passed through as `custom_data`
  on the checkout and echoed back verbatim in the webhook payload — that's
  how a confirmed payment gets tied back to what it paid for.
- `POST /api/webhooks/lemonsqueezy` is the only place a boost/revive/defend
  is ever actually granted. It verifies the `X-Signature` header (HMAC-
  SHA256 over the raw body with `LEMONSQUEEZY_WEBHOOK_SECRET`) before
  touching anything, then only acts on a `status: "paid"` `order_created`
  event. The `payments` table's unique constraint on
  `lemonsqueezy_order_id` makes this idempotent against webhook retries —
  a duplicate delivery is a no-op, not a double-grant.
- Boost re-derives which side of the match to credit from the match row
  itself (never trusts a client-supplied side) and applies via a
  `boost_votes()` Postgres function — same atomic-increment pattern as
  voting. Revive/defend are applied via conditional updates
  (`.eq("status", "eliminated")` / `.eq("status", "champion")`) so a
  delayed or retried webhook can't stomp on state that's already moved on
  (e.g. a product that won its way back to Champion before a stale revive
  webhook arrives).
- Defending the throne (`is_defending: true`) re-enters a champion into the
  pool needing 3 fresh wins; winning while defending increments the
  existing `champions` row's `times_defended` instead of crowning a new
  entry. Losing while defending eliminates them like any other duel loss.

### Public product pages + champion badge (Phase 4)

- `/product/[id]` — public page for any submitted product: status, pitch,
  link, category, and full duel history (win/loss + score, newest first).
  A crowned product also shows when it was crowned, times defended, and
  (only while still reigning) its embed snippet.
- `/api/badge/[id]` — server-rendered SVG badge (`image/svg+xml`, 1h cache),
  404s for anything that isn't currently a champion. Self-contained dark
  card with the accent color, so it looks the same regardless of the host
  site's theme.
- The embed snippet is a plain `<a><img></a>` pointed at the badge endpoint
  and the product's `/product/[id]` page — the intended backlink loop from
  every champion's site back to the Arena.

### Design system

Flat, non-gradient, light/dark aware via `prefers-color-scheme` (no manual
toggle yet). Tokens in `src/app/globals.css`:

- Primary surface: white (`#ffffff`) in light mode, black (`#000000`) in
  dark mode — `--bg`, with `--surface`/`--surface-2` as near-neutral card
  tints and `--ink`/`--muted` as the corresponding text colors.
- Accent: `#00b4d8` (`--accent`) and `#90e0ef` (`--accent-soft`), used for
  buttons, active states, links, progress bars, and highlighted text.
  `--accent-ink` is the fixed dark text color used on accent-colored
  backgrounds for contrast.
- `--danger`/`--danger-soft` (red) reserved for errors and the eliminated
  badge — the only non-accent color in the UI.
