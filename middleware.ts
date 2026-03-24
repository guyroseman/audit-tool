import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// ─── Route groups ─────────────────────────────────────────────────────────────
// PUBLIC  — anyone, no auth needed
// LOGIN   — auth page itself (must be public to avoid loop)
// AUTH    — must be logged in (any plan, including free)
// PAID    — must be logged in AND have pulse or scale plan

const PUBLIC_PREFIXES = ["/", "/funnel", "/subscribe", "/legal", "/api", "/blog", "/about"];
const LOGIN_PATH      = "/login";
const AUTH_PATHS      = ["/dashboard"];
const ADMIN_PATHS     = ["/batch-audit"];

function isPaid(plan: string | null | undefined): boolean {
  return plan === "pulse" || plan === "scale";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Always pass through public routes
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some(p => p !== "/" && pathname.startsWith(p)) ||
    pathname === LOGIN_PATH
  ) {
    return NextResponse.next();
  }

  // Build supabase SSR client
  const res = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Not logged in → send to login with return path
  if (!session) {
    if (AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      const url = new URL(LOGIN_PATH, request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  // /batch-audit — admin only (email must be in ADMIN_EMAILS env var)
  if (ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    const userEmail = session.user.email?.toLowerCase() ?? "";
    if (!adminEmails.includes(userEmail)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return res;
  }

  // Logged in — check plan for gated routes
  const needsPlanCheck =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (needsPlanCheck) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", session.user.id)
      .single();

    // /dashboard requires any paid plan
    if (!isPaid(profile?.tier)) {
      const url = new URL("/subscribe", request.url);
      url.searchParams.set("reason", "upgrade");
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};