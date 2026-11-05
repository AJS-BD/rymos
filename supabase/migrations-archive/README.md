# Archived migrations

These SQL files are **archived copies, not live migrations**. Do not apply
them directly — the operative files are `supabase/migrations/` and the
idempotent prod-sync file `supabase/sync_20260922_prod_sync.sql` (mirrored in
`src/lib/sync-sql.ts`, which is what `/setup` applies).

## `20260907_initial_schema.sql`

Byte-identical copy of `supabase/migrations/20260907000000_initial_schema.sql`
(the project's first schema). It used to live at `prisma/schema.sql`, which
was misleading: **this project does not use Prisma at all** — there is no
`schema.prisma`, no `@prisma/client` dependency, and no Prisma import
anywhere in the code. The file was moved here (2026-11-05) so the `prisma/`
folder name no longer implies a Prisma setup. The SQL content was not
changed; it is kept only as a historical record.

Note: this archived copy still defines the orphaned singular `wishlist`
table. The app code uses the plural `wishlists` table (created by the sync
SQL). See `supabase/migrations/20261105_cleanup_wishlist.sql` for the
cleanup of the orphaned singular table.
