import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAdminFromRequest, getBearerUser } from "@/lib/admin-auth-server";

/**
 * GET  — public for category='store' rows (store name/address/phone — the
 *         contact + FAQ pages read those). Every other category (whatsapp /
 *         email / payment / general — i.e. all secrets) requires an admin
 *         session: send `Authorization: Bearer <access_token>`.
 * POST — admin only (401: no/invalid session, 403: signed in, not an admin).
 *         Writes run through the caller's own user-scoped client so RLS
 *         enforces the admin-only settings policies as well.
 *
 * Previously this route had no auth check at all and ran on the anon client:
 * GET could only ever return store rows (anon RLS), POST could not write at
 * all via RLS — and any signed-in user could bypass the route entirely and
 * read/write secrets directly with the anon key, because the old settings RLS
 * gave every authenticated user FOR ALL ... USING (true). The RLS fix lives
 * in supabase/migrations/20261105_security_settings.sql; this route is the
 * second layer (and the only layer that works before that migration is
 * applied, since the public filter below is explicit, not RLS-dependent).
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    // Admins read through their own session (sees all categories under RLS);
    // everyone else reads through the anon client, filtered to store rows.
    const supabase = admin ? admin.client : getSupabase();
    let query = supabase
      .from("settings")
      .select("*")
      .order("category", { ascending: true });
    if (!admin) {
      query = query.eq("category", "store");
    }
    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      // Distinguish "not signed in" (401) from "signed in, not an admin" (403).
      const bearer = await getBearerUser(req);
      return NextResponse.json(
        { error: bearer ? "Admin access required." : "Not authenticated." },
        { status: bearer ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { key, value, description, category, settings } = body;

    // Writes go through the admin's own session so RLS sees an admin.
    const supabase = admin.client;

    // Handle batch update
    if (settings && typeof settings === "object") {
      const updates = Object.entries(settings).map(([k, v]) => ({
        key: k,
        value: (v as string) ?? null,
        description: null,
        category: category ?? "general",
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("settings")
        .upsert(updates, { onConflict: "key" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, count: updates.length });
    }

    // Handle single setting update
    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          key,
          value: value ?? null,
          description: description ?? null,
          category: category ?? "general",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
