import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

const publicRoutes = new Set(["/login", "/signup"]);

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let env: ReturnType<typeof getPublicSupabaseEnv>;
  try {
    env = getPublicSupabaseEnv();
  } catch {
    return NextResponse.next({ request });
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = env;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAuthRoute = publicRoutes.has(request.nextUrl.pathname);
  let hasActiveProfile = false;

  if (user) {
    const { data, error } = await supabase.rpc("is_active_user");
    hasActiveProfile = !error && data === true;
  }

  if ((!user || !hasActiveProfile) && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (user && !hasActiveProfile) {
      url.searchParams.set("message", "Account access is inactive. Contact the owner.");
    }
    return NextResponse.redirect(url);
  }

  if (user && hasActiveProfile && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
