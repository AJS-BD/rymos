import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest, getAuthCookieName } from "@/lib/admin-auth-server";

/**
 * Admin session cookie — the bridge between the browser client (which keeps
 * its Supabase session in localStorage, invisible to the server) and
 * src/proxy.ts (which can only read cookies).
 *
 *   POST   { session } — verify the session belongs to an active admin, then
 *          store it as an httpOnly cookie named `sb-<ref>-auth-token` (the
 *          name @supabase/ssr reads) so the proxy can refresh the session and
 *          gate /admin/*. Called from src/lib/admin-session.ts after a
 *          successful admin login / first-time setup.
 *   DELETE — clear the cookie (admin logout).
 *
 * The cookie holds the same session JSON the browser already stores in
 * localStorage — it grants nothing new, it just makes the existing session
 * visible to the server. It is httpOnly so page JS cannot read it (XSS
 * cannot steal the token from the cookie; the localStorage copy remains the
 * weaker link, unchanged by this route).
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Not authenticated as an admin." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const session = body?.session;
    if (
      !session ||
      typeof session.access_token !== "string" ||
      typeof session.refresh_token !== "string"
    ) {
      return NextResponse.json(
        { error: "A valid session is required." },
        { status: 400 }
      );
    }
    // The token in the body must be the same session that was just verified.
    if (session.access_token !== admin.token) {
      return NextResponse.json(
        { error: "Session mismatch." },
        { status: 400 }
      );
    }

    const cookieName = getAuthCookieName();
    if (!cookieName) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(cookieName, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Refresh tokens keep the session alive; the proxy refreshes it via
      // @supabase/ssr. 7 days bounds a stale cookie if refresh ever stops.
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieName = getAuthCookieName();
  const res = NextResponse.json({ success: true });
  if (cookieName) {
    res.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}
