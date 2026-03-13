import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/impressum", "/privacy"]);

export default clerkMiddleware(async (auth, request) => {
  // Auto-detect locale from Accept-Language if cookie not set
  const hasLocaleCookie = request.cookies.get("NEXT_LOCALE");
  if (!hasLocaleCookie) {
    const acceptLang = request.headers.get("accept-language") || "";
    const prefersDe = acceptLang
      .split(",")
      .some((part) => part.trim().startsWith("de"));
    const locale = prefersDe ? "de" : "en";

    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    if (!isPublicRoute(request)) {
      await auth.protect();
    }

    return response;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|ogg)).*)",
    "/(api|trpc)(.*)",
  ],
};
