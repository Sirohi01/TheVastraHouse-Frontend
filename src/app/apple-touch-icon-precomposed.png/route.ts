import AppleIcon from "../apple-icon";

/** Older iOS versions and crawlers probe this path; same icon as /apple-touch-icon.png. */
export const dynamic = "force-static";

export function GET() {
  return AppleIcon();
}
