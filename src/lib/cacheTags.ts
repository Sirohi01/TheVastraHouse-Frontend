/**
 * Cache policy for public API data fetched during server rendering.
 *
 * Every public fetch carries PUBLIC_DATA_TAG so one POST /api/revalidate (sent by the API after an
 * admin change) refreshes all of it. With that in place the time-based window can be longer: it
 * only bounds staleness if the webhook is not configured or a call is missed. Personal data
 * (cart, account, checkout) is never fetched with these options.
 */
export const PUBLIC_DATA_TAG = "storefront";

/** CMS content, CMS pages, SEO settings, catalog home tiles, redirects. */
export const PUBLIC_DATA_REVALIDATE_SECONDS = 300;

export function publicFetchOptions(
  tags: string[] = [],
  revalidate = PUBLIC_DATA_REVALIDATE_SECONDS,
) {
  return { next: { revalidate, tags: [PUBLIC_DATA_TAG, ...tags] } };
}
