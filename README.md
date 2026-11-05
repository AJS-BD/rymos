# RYmos — Smartphone & Accessories E-Commerce (Bangladesh)

RYmos is an e-commerce storefront for smartphones and accessories, based in
Dhaka, Bangladesh. Customers browse products, buy with cash on delivery,
pick up in store, or buy on credit with monthly instalments. The same
codebase includes a full admin panel (dashboard, in-store POS, products,
orders, customers, credit applications, instalments, coupons, reviews,
messages, settings) and customer↔admin in-app chat.

- **Store:** Level 4, Block D, Bashundhara City Shopping Complex, Dhaka 1229
- **Currency:** BDT (৳)
- **Live site:** https://rymos-xafors-projects.vercel.app
- **Repo:** https://github.com/AJS-BD/rymos

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4, Framer Motion, Lucide icons
- **Backend / database / auth:** Supabase (Postgres + Auth + Realtime)
- **Validation:** Zod
- **POS extras:** `qrcode` (walk-in profile-completion QR codes)

## Payments — no online payments

RYmos takes **no online payments**. The accepted payment methods are:

- **Cash on delivery (COD)** — pay in cash when the order arrives.
- **Shop pickup** — pay in store with bKash, Nagad, Rocket, or card.
- **Buy on credit / instalments** — pay monthly instalments with the same
  methods (cash, bKash, Nagad, bank).

Stripe / bKash / Nagad keys can be stored on the admin Settings page, but
no checkout code calls a payment gateway and there is no payment webhook.
Do not present the store as accepting online card/bKash payments.

## Phone OTP — needs an SMS provider

The login page has a Phone OTP tab, but phone sign-in only works once an
SMS provider is configured in the **Supabase dashboard** (Authentication →
Sign In / Providers → Phone → SMS provider, e.g. Twilio). Until then the
tab is disabled and customers must use email login. Full setup steps are in
[docs/PHONE-OTP-SETUP.md](docs/PHONE-OTP-SETUP.md).

## Getting started (local dev)

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
npx tsc --noEmit # typecheck
```

Without Supabase env vars the app still starts, but Supabase-backed pages
fall back to a placeholder client and show empty/error states
(see `src/lib/supabase.ts`).

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. Only two variables are
required to run the app:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | No (server only) | Service-role key. **Never expose it to the browser** (no `NEXT_PUBLIC_` prefix). Only needed by server-side code that must bypass RLS; keep it out of git and out of `.env.local` unless a server route actually uses it. |

Never commit `.env.local` or any file containing real keys.

## Supabase setup

There are two ways to create the database schema in a Supabase project:

1. **In-app setup (recommended):** run the app, open `/setup`, paste a
   Supabase personal access token, and let it apply the bundled sync SQL
   (`src/lib/sync-sql.ts`, mirrored from
   `supabase/sync_20260922_prod_sync.sql`). It verifies the tables and
   generates a one-time first-admin setup code. The same flow is available
   as a manual GitHub Actions workflow:
   `.github/workflows/apply-supabase-sync.yml`.
2. **SQL Editor:** apply the files in `supabase/migrations/` in order,
   then `supabase/sync_20260922_prod_sync.sql`.

After setup, create the first admin with the one-time code from `/setup`
(see `admin_bootstrap` in the database).

### Database migrations

- Live migrations live in `supabase/migrations/` (named
  `YYYYMMDDHHMMSS_description.sql`).
- `supabase/sync_20260922_prod_sync.sql` is the idempotent prod-sync file;
  it is duplicated verbatim in `src/lib/sync-sql.ts` — if you change one,
  change the other (they have drifted out of sync before).
- `supabase/migrations-archive/` holds archived copies only (not applied
  by anything). See its `README.md`.
- **Applying a new migration manually:** in the Supabase dashboard, open
  the SQL Editor, paste the contents of the migration file, and run it.
  For example, to apply the wishlist cleanup
  (`supabase/migrations/20261105_cleanup_wishlist.sql` — drops the orphaned
  singular `wishlist` table; the app uses the plural `wishlists` table):
  open the SQL Editor → New query → paste the file → Run. It is
  idempotent (`DROP TABLE IF EXISTS`), so re-running it is safe. Check
  first that the singular `wishlist` table holds no data you need.
- **2026-11-05 upgrade migrations** (all in `supabase/migrations/`, all
  idempotent, none applied automatically — apply each in the SQL Editor
  in this order): `20261105_security_settings.sql` (settings RLS),
  `20261105_checkout_coupons.sql` (coupon/order columns, stock checks),
  `20261105_returns.sql` (returns/refunds columns + CHECK widening),
  `20261105_cleanup_wishlist.sql` (drop orphaned `wishlist` table).
  See `rymos-fix-report.md` in the workspace for the exact steps.

## Project layout

```
src/app/            # App Router pages (storefront, auth, customer, admin)
src/app/api/        # API routes (setup/apply, settings, customers, complete-profile)
src/components/     # layout, ui, chat, cart, admin components
src/context/        # auth, admin-auth, cart (localStorage) providers
src/lib/            # supabase client, sync SQL bundle, utils, token helpers
supabase/           # migrations, prod-sync SQL, archived SQL
scripts/            # one-off audit/validation helpers (not part of the app)
```

Key facts about the current implementation:

- The cart is **localStorage-only** (`src/context/cart-context.tsx`); the
  `cart_items` DB table is not used by app code.
- Orders are created server-side (`POST /api/orders/create`), which
  re-prices every line from the DB, validates coupons, decrements stock
  atomically and generates the order number. Never trust client totals.
- The homepage featured products come from the `products` table
  (`is_featured = true`); testimonials come from approved product reviews.
- This project does **not** use Prisma: there is no `schema.prisma` and no
  `@prisma/client`. (An old `prisma/schema.sql` was a copy of a SQL
  migration; it now lives in `supabase/migrations-archive/`.)

## Deployment

Deploy on Vercel (the live site above) with the two `NEXT_PUBLIC_*`
variables set in the project settings. There is no CI workflow in this repo
yet — run `npx tsc --noEmit`, `npm run lint`, and `npm run build` locally
before pushing.
