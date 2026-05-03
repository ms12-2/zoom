import { NextRequest } from "next/server";

export function requireRelaySecret(req: NextRequest): boolean {
  const expected = (process.env.RELAY_SECRET || "").trim();
  // If no relay secret is configured on Vercel, allow requests.
  // This avoids hard-locking claim/complete endpoints during first setup.
  if (!expected) return true;
  const q = (req.nextUrl.searchParams.get("secret") || "").trim();
  const h = (req.headers.get("x-relay-secret") || "").trim();
  const auth = (req.headers.get("authorization") || "").trim();
  let bearer = "";
  if (/^bearer\s+/i.test(auth)) {
    bearer = auth.replace(/^bearer\s+/i, "").trim();
  }
  return q === expected || h === expected || bearer === expected;
}
