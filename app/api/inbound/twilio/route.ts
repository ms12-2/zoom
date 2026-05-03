import { NextRequest, NextResponse } from "next/server";
import { processInboundZoomMessage } from "@/lib/inbound-zoom-message";
import { twilioWebhookPublicUrl, validateTwilioRequest } from "@/lib/twilio-signature";

const EMPTY_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twimlResponse(status: number = 200) {
  return new NextResponse(EMPTY_TWIML, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/**
 * Twilio Programmable Messaging (SMS / WhatsApp) inbound webhook.
 * Auth: X-Twilio-Signature + TWILIO_AUTH_TOKEN (set on Vercel). No RELAY_SECRET.
 *
 * Configure in Twilio Console: when a message comes in → POST to
 *   https://<your-relay-domain>/api/inbound/twilio
 */
export async function POST(req: NextRequest) {
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const skip =
    (process.env.TWILIO_SKIP_SIGNATURE_VERIFY || "").trim().toLowerCase() === "1" ||
    (process.env.TWILIO_SKIP_SIGNATURE_VERIFY || "").trim().toLowerCase() === "true";

  if (!authToken && !skip) {
    return NextResponse.json(
      { ok: false, error: "TWILIO_AUTH_TOKEN not configured on server" },
      { status: 503 },
    );
  }

  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw).entries()) as Record<string, string>;
  const signature = req.headers.get("x-twilio-signature");
  const url = twilioWebhookPublicUrl(req);

  if (!skip && authToken && !validateTwilioRequest(authToken, signature, url, params)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const message = String(params.Body || "");
  const from = String(params.From || "");
  const waId = String(params.WaId || "");
  const chat_id = from || waId;
  const sender_id = waId || from.replace(/^whatsapp:/i, "").trim();

  const result = await processInboundZoomMessage({
    message,
    chat_id,
    chat_type: "dm",
    sender_id,
    source: "twilio_whatsapp",
  });

  if (!result.ok) {
    console.error("[twilio inbound]", result.error);
    // 200 + empty TwiML avoids Twilio retry storms; check Vercel logs for enqueue errors.
    return twimlResponse(200);
  }

  if (result.skipped) {
    return twimlResponse(200);
  }

  return twimlResponse(200);
}
