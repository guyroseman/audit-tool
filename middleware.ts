import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// 1. Import CookieOptions here
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// ─── Routes ───────────────────────────────────────────────────────────────────
// Public  — anyone can access
// Auth    — must be logged in (free tier ok)
// Paid    — must have plan = 'pulse' or 'scale'

const PUBLIC_ROUTES = ["/", "/funnel", "/subscribe", "/login", "/legal"];
const AUTH_ROUTES   = ["/dashboard", "/call-center"];

function isPaid(plan: string | null): boolean {
  return plan === "pulse" || plan === "scale";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes & static assets
  if (
    PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Build supabase client that reads cookies from the request
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        // 2. Add the explicit type here
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Not logged in → send to login for any auth/paid route
  if (!session) {
    if (AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Logged in — check plan for dashboard
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", session.user.id)
      .single();

    if (!profile || !isPaid(profile.plan)) {
      // Redirect to subscribe with a message
      const subscribeUrl = new URL("/subscribe", request.url);
      subscribeUrl.searchParams.set("reason", "upgrade");
      return NextResponse.redirect(subscribeUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};