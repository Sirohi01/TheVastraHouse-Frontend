import AppleIcon from "../apple-icon";

/** iOS and crawlers probe this legacy path even when the page declares its apple-touch-icon. */
export const dynamic = "force-static";

export function GET() {
  return AppleIcon();
}
