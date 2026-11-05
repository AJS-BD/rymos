import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (the `middleware` file convention is deprecated and
 * renamed to `proxy` — see node_modules/next/dist/docs/.../proxy.md).
 * File: src/proxy.ts, export: `proxy`. Do NOT recreate src/middleware.ts.
 *
 * Why this exists: the old middleware (removed Sept 11 2026, commits
 * 2ca87a7/e5a59aa) only set an `x-pathname` header, matched EVERY request
 * (except _next/static, _next/image, favicon.ico) and did no auth — it was
 * removed as broken/unneeded. This proxy does the opposite: it runs ONLY on
 * /admin/* (matcher below — static assets, _next/*, public files and API
 * routes are never touched) and does exactly two things:
 *   1. Refresh the Supabase session from the admin session cookie
 *      (@supabase/ssr), so a valid session survives across /admin pages.
 *   2. Redirect visitors with no (or a non-admin) session to /admin/login.
 * /setup is not under /admin/* so it is unaffected; /admin/login is
 * excluded explicitly so a redirect can never loop.
 *
 * How the proxy sees a session at all: the browser client keeps its session
 * in localStorage, which the server cannot read. After an admin signs in,
 * src/lib/admin-session.ts copies the server-verified session into an
 * httpOnly `sb-<ref>-auth-token` cookie (POST /api/admin/session); the proxy
 * reads that cookie. Admins signed in before this shipped have no cookie
 * yet — their first /admin navigation after deploy redirects to /admin/login
 * once, and signing in again sets the cookie.
 *
 * Fail-open cases (deliberate, with the client-side gate as backstop):
 *   - Supabase env vars missing: the proxy cannot verify anyone, so it lets
 *     the request through; AdminAuthProvider still gates the panel, and in
 *     production it fails closed (see src/context/admin-auth-context.tsx).
 *   - Dev-only unprotected mode (NODE_ENV !== 'production' AND
 *     ALLOW_UNPROTECTED_ADMIN_DEV=true): same flag as the admin context.
 *     In production this bypass does not exist.
 * On any other failure (no session, expired session that cannot refresh,
 * signed-in user with no active admin_users row, admin_users table missing)
 * the proxy redirects to /admin/login — fail closed.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Cannot verify anyone without Supabase configured — let the
    // client-side AdminAuthProvider gate handle it (fails closed in prod).
    return supabaseResponse;
  }

  // Dev-only unprotected mode — mirrors admin-auth-context.tsx. Production
  // never takes this branch (NODE_ENV check), so there is no prod bypass.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_UNPROTECTED_ADMIN_DEV === "true"
  ) {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login") {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";

  if (!user) {
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in, but is this user an admin? (Own-row lookup — works under
  // both the old and the tightened admin_users RLS policies.)
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!adminRow) {
    loginUrl.searchParams.set("error", "not-admin");
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  // Narrow matcher: only /admin routes. Static assets, _next/*, public/
  // files, /api/* and the storefront never run this proxy — the Sept 2026
  // bug was a matcher that ran on (almost) everything.
  matcher: ["/admin", "/admin/:path*"],
};
