import { notFound } from "next/navigation";
import { applyManagedRedirect } from "@/lib/redirects";

/**
 * Catch-all for URLs no route matches: honours redirects managed in Admin > SEO > Redirects
 * (and automatic slug-change redirects), otherwise returns a real 404.
 */
export default async function UnmatchedPath({ params }: Readonly<{ params: Promise<{ path: string[] }> }>) {
  const { path } = await params;
  await applyManagedRedirect(`/${path.map(encodeURIComponent).join("/")}`);
  notFound();
}
