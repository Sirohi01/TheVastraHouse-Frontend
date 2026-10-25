import { permanentRedirect, redirect } from "next/navigation";
import { apiBaseUrl } from "@/lib/api";
import { publicFetchOptions } from "@/lib/cacheTags";

/**
 * Looks up an admin-managed or slug-change redirect for a path that would otherwise 404 and
 * issues it (301/308 → permanentRedirect, 302 → redirect). Returns normally when none exists.
 */
export async function applyManagedRedirect(path: string) {
  let target: { destination: string; statusCode: number } | null = null;

  try {
    const response = await fetch(
      `${apiBaseUrl}/content/redirects/resolve?path=${encodeURIComponent(path)}`,
      publicFetchOptions(["redirects"]),
    );
    if (response.ok) {
      target = (
        (await response.json()) as { redirect: { destination: string; statusCode: number } | null }
      ).redirect;
    } else {
      logRedirectFailure(path, `status ${response.status}`);
    }
  } catch (error) {
    // A failed lookup degrades to a 404; log it so lost redirects are noticed.
    logRedirectFailure(path, error instanceof Error ? error.message : "request failed");
    target = null;
  }

  if (!target) return;

  if (target.statusCode === 302) {
    redirect(target.destination);
  }

  permanentRedirect(target.destination);
}

function logRedirectFailure(path: string, reason: string) {
  console.warn(
    JSON.stringify({ event: "redirect_resolve_failed", path: path.slice(0, 300), reason }),
  );
}
