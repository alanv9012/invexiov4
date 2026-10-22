import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

const publicRoutes = new Set(["/login", "/signup"]);

type AccessCode = "inactive" | "unavailable";

function redirectFromRequest(
  request: NextRequest,
  pathname: string,
  response?: NextResponse,
  access?: AccessCode
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (access) {
    url.searchParams.set("access", access);
  }

  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of response?.cookies.getAll() ?? []) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

function authenticationUnavailable(
  request: NextRequest,
  isAuthRoute: boolean,
  response: NextResponse
): NextResponse {
  return isAuthRoute
    ? response
    : redirectFromRequest(request, "/login", response, "unavailable");
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const isAuthRoute = publicRoutes.has(request.nextUrl.pathname);
  let env: ReturnType<typeof getPublicSupabaseEnv>;
  try {
    env = getPublicSupabaseEnv();
  } catch {
    if (isAuthRoute) {
      return NextResponse.next({ request });
    }

    return redirectFromRequest(request, "/login", undefined, "unavailable");
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = env;

  let response = NextResponse.next({ request });

  let user: User | null = null;
  let hasActiveProfile = false;

  try {
    const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const previousResponseCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          previousResponseCookies.forEach((cookie) => response.cookies.set(cookie));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    });

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return authenticationUnavailable(request, isAuthRoute, response);
    }
    user = data.user;

    if (user) {
      const { data: activeProfile, error: profileError } = await supabase.rpc("is_active_user");
      if (profileError) {
        return authenticationUnavailable(request, isAuthRoute, response);
      }
      hasActiveProfile = activeProfile === true;
    }
  } catch {
    return authenticationUnavailable(request, isAuthRoute, response);
  }

  if ((!user || !hasActiveProfile) && !isAuthRoute) {
    return redirectFromRequest(
      request,
      "/login",
      response,
      user && !hasActiveProfile ? "inactive" : undefined
    );
  }

  if (user && hasActiveProfile && isAuthRoute) {
    return redirectFromRequest(request, "/", response);
  }

  return response;
}
