import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { applyManagedRedirect } from "@/lib/redirects";

/**
 * Catch-all for URLs no route matches: honours redirects managed in Admin > SEO > Redirects
 * (and automatic slug-change redirects), otherwise returns a real 404.
 */
export default async function UnmatchedPath({
  params,
}: Readonly<{ params: Promise<{ path: string[] }> }>) {
  const { path } = await params;
  const pathname = `/${path.map(encodeURIComponent).join("/")}`;
  await applyManagedRedirect(pathname);
  await logNotFound(pathname);
  notFound();
}

/**
 * One structured line per unmatched URL so 404 sources (internal link vs. external referrer vs.
 * crawler probe) can be found in the container logs. No query strings, cookies or IPs.
 */
async function logNotFound(pathname: string) {
  const requestHeaders = await headers();
  console.warn(
    JSON.stringify({
      event: "not_found",
      path: pathname.slice(0, 300),
      referer: referrerWithoutQuery(requestHeaders.get("referer")),
      userAgent: (requestHeaders.get("user-agent") ?? "").slice(0, 160),
    }),
  );
}

function referrerWithoutQuery(value: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return undefined;
  }
}
