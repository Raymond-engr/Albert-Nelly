import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === "/control-room/login" ||
    pathname === "/control-room/mfa" ||
    pathname === "/control-room/accept-invite" ||
    pathname === "/control-room/forgot-password" ||
    pathname === "/control-room/reset-password";

  if (!user && pathname.startsWith("/control-room") && !isAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/control-room/login";
    return NextResponse.redirect(loginUrl);
  }

  if (!user && pathname.startsWith("/api/control-room")) {
    return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/control-room/:path*", "/api/control-room/:path*"],
};
