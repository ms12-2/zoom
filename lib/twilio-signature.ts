import { createHmac, timingSafeEqual } from "crypto";

/**
 * Twilio request validation: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 * Concatenate request URL with sorted POST parameter key+value pairs, HMAC-SHA1 with auth token, base64.
 */
export function validateTwilioRequest(
  authToken: string,
  twilioSignature: string | null | undefined,
  requestUrl: string,
  params: Record<string, string>,
): boolean {
  if (!authToken || !twilioSignature) return false;
  const sig = twilioSignature.trim();
  const data =
    requestUrl +
    Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + (params[key] ?? ""), "");
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** Public URL Twilio called (must match webhook config). */
export function twilioWebhookPublicUrl(req: { headers: Headers; nextUrl: { pathname: string } }): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const path = req.nextUrl.pathname;
  return `${proto}://${host}${path}`;
}
