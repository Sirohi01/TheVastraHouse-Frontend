import Icon from "../icon";

/**
 * Browsers, feed readers and crawlers request /favicon.ico regardless of the <link rel="icon">
 * tag, and it was a steady source of 404s. Serves the same generated PNG as /icon (PNG favicons
 * are accepted everywhere), built once at build time.
 */
export const dynamic = "force-static";

export function GET() {
  return Icon();
}
