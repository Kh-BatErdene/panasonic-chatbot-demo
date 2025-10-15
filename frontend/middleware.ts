import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["ja", "en"],
  defaultLocale: "ja",
  localePrefix: "never",
});

export function middleware(req: NextRequest) {
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
