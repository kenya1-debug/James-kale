import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: proxy.ts replaces middleware.ts

function redirectWithCookies(url: URL, from: NextResponse) {
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

async function guardAdmin(request: NextRequest) {
  const { supabase, response, claims } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  response.headers.set("Cache-Control", "private, no-store");

  const toLogin = (error?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (error) url.searchParams.set("error", error);
    else url.searchParams.set("next", pathname + search);
    return redirectWithCookies(url, response);
  };

  if (!claims) return isLogin ? response : toLogin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!profile?.is_active) return isLogin ? response : toLogin("inactive");

  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return redirectWithCookies(url, response);
  }
  return response;
}

// English at "/", Kiswahili at "/sw". Internally everything lives under /[locale].
function handleLocale(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/sw" || pathname.startsWith("/sw/")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return guardAdmin(request);
  return handleLocale(request);
}

export const config = {
  // Skip API routes, Next internals, generated metadata images and any path with a file extension (sitemap.xml, robots.txt…)
  matcher: ["/((?!api|_next/static|_next/image|opengraph-image|icon|apple-icon|.*\\..*).*)"],
};
