import { permanentRedirect, redirect } from "next/navigation";
import { apiBaseUrl } from "@/lib/api";

/**
 * Looks up an admin-managed or slug-change redirect for a path that would otherwise 404 and
 * issues it (301/308 → permanentRedirect, 302 → redirect). Returns normally when none exists.
 */
export async function applyManagedRedirect(path: string) {
  let target: { destination: string; statusCode: number } | null = null;

  try {
    const response = await fetch(
      `${apiBaseUrl}/content/redirects/resolve?path=${encodeURIComponent(path)}`,
      { next: { revalidate: 60 } },
    );
    if (response.ok) {
      target = (
        (await response.json()) as { redirect: { destination: string; statusCode: number } | null }
      ).redirect;
    }
  } catch {
    target = null;
  }

  if (!target) return;

  if (target.statusCode === 302) {
    redirect(target.destination);
  }

  permanentRedirect(target.destination);
}
