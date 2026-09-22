import { NextRequest, NextResponse } from "next/server";
import { SYNC_SQL } from "@/lib/sync-sql";

// 5 sequential Management API round-trips + a 24KB DDL apply can exceed the
// 10s Hobby default — allow the full 60s so the one-shot setup isn't killed
// mid-apply (the SQL is idempotent, but a timeout would confuse the user).
export const maxDuration = 60;

/**
 * Self-service one-time database setup.
 *
 * POST /api/setup/apply
 *   body: { token: string }   — a Supabase personal access token
 *                                  (supabase.com/dashboard/account/tokens)
 *
 * Applies supabase/sync_20260922_prod_sync.sql to the production project via
 * the Management API (POST /v1/projects/{ref}/database/query — the same
 * endpoint the dashboard SQL Editor uses), verifies the expected tables now
 * exist, and if no admin exists yet, generates + stores a single-use
 * first-admin setup code and returns it so the UI can display it.
 *
 * The token is used only for this request and never stored.
 */

const PROJECT_REF = "imcsesyqurkpvguwpmem";

const EXPECTED_TABLES = [
  "settings",
  "coupons",
  "wishlists",
  "credit_applications",
  "credit_plans",
  "installments",
  "order_status_history",
  "product_reviews",
  "contact_messages",
  "admin_users",
];

// Unambiguous charset (no 0/O/1/I/L) so the code is readable on a phone.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let raw = "";
  for (let i = 0; i < 8; i++) {
    raw += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

async function mgmtQuery(
  token: string,
  query: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    }
  );
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.status === 200 || res.status === 201, status: res.status, data };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json(
        { error: "Paste your Supabase access token first." },
        { status: 400 }
      );
    }

    // 1. The sync SQL is bundled with the deployment (src/lib/sync-sql.ts).
    const sql = SYNC_SQL;

    // 2. Validate the token and project access with a cheap query first.
    const probe = await mgmtQuery(token, "SELECT 1 AS ok;");
    if (!probe.ok) {
      const msg =
        probe.status === 401 || probe.status === 403
          ? "That token was rejected (401/403). Make sure you created a personal access token at supabase.com/dashboard/account/tokens and pasted the whole value."
          : `Supabase API returned HTTP ${probe.status}.`;
      return NextResponse.json({ error: msg, status: probe.status }, { status: 400 });
    }

    // 3. Apply the sync SQL (idempotent — safe even if partially applied before).
    const apply = await mgmtQuery(token, sql);
    if (!apply.ok) {
      const detail =
        typeof apply.data === "object" && apply.data !== null
          ? JSON.stringify(apply.data).slice(0, 600)
          : "unknown error";
      return NextResponse.json(
        { error: `Applying the sync SQL failed (HTTP ${apply.status}).`, detail },
        { status: 502 }
      );
    }

    // 4. Verify the expected tables now exist.
    const verify = await mgmtQuery(
      token,
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    const tables: string[] =
      verify.ok && Array.isArray(verify.data)
        ? (verify.data as { table_name?: string }[]).map((r) => r.table_name ?? "")
        : [];
    const missing = EXPECTED_TABLES.filter((t) => !tables.includes(t));

    // 5. If no admin exists yet, generate + store the first-admin setup code.
    let setupCode: string | null = null;
    let codeError: string | null = null;
    const adminCheck = await mgmtQuery(
      token,
      "SELECT count(*)::int AS n FROM admin_users WHERE is_active;"
    );
    const adminCount =
      adminCheck.ok && Array.isArray(adminCheck.data)
        ? Number((adminCheck.data as { n?: number }[])[0]?.n ?? 0)
        : -1;

    if (adminCount === 0) {
      setupCode = randomCode();
      const insert = await mgmtQuery(
        token,
        `INSERT INTO admin_bootstrap (code) VALUES ('${setupCode}');`
      );
      if (!insert.ok) {
        codeError = "Tables are synced, but storing the setup code failed — open /admin/login and use the GitHub workflow code instead.";
        setupCode = null;
      }
    }

    return NextResponse.json({
      success: true,
      tablesFound: tables.length,
      missing,
      adminCount,
      setupCode,
      codeError,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
