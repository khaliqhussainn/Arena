## The Arena

Product battle platform: submit a product for free, get auto-paired head-to-head
against another product in your category, first to 100 votes wins. Win 3 duels in a
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
- **Phase 5 (done):** polish — mobile, empty/loading states, anti-spam.

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
- Reaching 100 votes on a side resolves the match: the winner's streak
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

Premium, editorial, non-gradient: subtle translucent borders (not stark
black/white), soft layered shadows (`--shadow-sm/md/lg`), moderate corner
radius (`rounded-lg`/`rounded-xl`/`rounded-2xl` — no more than a couple of
full-pill shapes), hover elevation (`-translate-y-0.5` + shadow bump) and
`active:scale-95` press feedback. Minimal Lucide icons throughout (no
emoji). Defaults to the OS's `prefers-color-scheme`, with a manual toggle
(sun/moon button in the sticky header) that overrides it — saved to
`localStorage` (`arena_theme`), applied via a `data-theme="light"|"dark"`
attribute on `<html>` set by a small inline script before first paint so
there's no flash of the wrong theme. Tokens in `src/app/globals.css`:

- Primary surface: white (`#ffffff`) in light mode, black (`#000000`) in
  dark mode — `--bg`, with `--surface`/`--surface-2` as near-neutral card
  tints, `--ink`/`--muted` as text, and `--border`/`--border-strong` as
  low-opacity hairlines (not solid black/white).
- Accent: `#00b4d8` (`--accent`) for primary CTAs/active states/vote
  buttons, `#90e0ef` (`--accent-soft`) for secondary fills (badges, tags,
  subtle washes). `--accent-ink` (black) is the fixed text color on
  accent-colored backgrounds. Used deliberately, not everywhere — most of
  the UI is still black/white/gray.
- `--danger` (`#ff3b30`) + `--danger-ink` (white): the eliminated ribbon
  and the near-loss warning ring — the only non-accent color, reserved for
  elimination/critical states.

**Structure (single-page, anchor-linked nav):** a sticky header
(`SiteHeader`) with logo, nav links that scroll to `#how-it-works`,
`#duels`, `#hall-of-fame`, `#about`, a submit-product page.

**Game-feel details worth knowing:**
- Hero has a low-opacity, slow-drifting combat backdrop (`ArenaBackdrop`:
  CSS-only sword/shield/crosshair silhouettes + a few pulsing sparks) —
  pure `transform`/`opacity` animation, no particle library.
- Each duel card (`MatchCard`) shows a per-side progress-to-5 bar, a live
  pulsing "Live" indicator, and a share action. **Near-loss state**: when
  a side's opponent hits 99/100 votes, that side gets a soft red ring and its
  boost button becomes an urgent "one from elimination" call to action.
- Vote counts pop with a quick slide-up animation on change (a CSS
  keyframe replayed via `key={votes}`, no animation library).
- Eliminated products (`EliminatedList`) keep a diagonal red "ELIMINATED"
  ribbon, softened into the premium card style (rounded, shadowed,
  slightly faded until hovered).
- The waiting-for-a-challenger card's primary CTA opens a pre-filled X
  share intent ("Invite a Rival"); the same component is reused on a lone
  product's own `/product/[id]` page.
- `Leaderboard` and the homepage stats row (`StatsRow`) are both backed by
  real aggregate queries in `getArenaState()` (product/duel/champion
  counts, votes cast today, top products by current win streak) — nothing
  on the page is a fabricated number. A per-match countdown and per-
  category "round number" from the original visual reference were
  deliberately **not** built: neither has a backing mechanic (matches
  don't expire on a timer, there's no round-numbering concept), and a
  fake one would misrepresent how the arena actually works.
- Sections below the fold (`How it Works`, `Hall of Fame`, `Power Moves`,
  `About`) fade/slide in on scroll via `ScrollReveal` (`IntersectionObserver`
  + a CSS keyframe, no library). The core duel/voting section is not
  scroll-gated, so it's never hidden behind a delay.

### Polish pass (Phase 5)

- **Mobile:** duel cards stack vertically below `sm` instead of squeezing
  two product columns side by side.
- **Loading states:** a root `loading.tsx` (spinner) and a
  `/product/[id]/loading.tsx` (skeleton) cover client-side navigation;
  every action button already had its own inline loading label
  ("Voting…", "Entering the arena…", "Starting checkout…").
- **Error/not-found states:** a branded `error.tsx` (with retry) replaces
  Next's default error overlay if a Supabase call throws, and a branded
  `not-found.tsx` covers both truly unmatched routes and `notFound()` calls
  (e.g. an invalid product id).
- **Anti-spam on submissions:** a honeypot field (invisible to real users,
  present in the DOM for bots that fill everything), a minimum-fill-time
  check (rejects a submission faster than a human could plausibly type
  one), and a case-insensitive duplicate-URL check — on top of the
  existing per-IP rate limit.
- **Anti-spam on votes:** added a per-visitor-fingerprint rate limit
  alongside the existing per-IP one — IP alone can false-positive on
  shared/NAT'd networks, and this also catches a bot that cycles IPs but
  reuses one visitor id.
