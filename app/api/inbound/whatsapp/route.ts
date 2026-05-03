import { NextRequest, NextResponse } from "next/server";
import { requireRelaySecret } from "@/lib/auth";
import { processInboundZoomMessage } from "@/lib/inbound-zoom-message";

/**
 * Fully automatic enqueue: POST raw WhatsApp fields; server extracts Zoom URL.
 * Auth: same as relay (X-Relay-Secret, ?secret=, or Authorization: Bearer).
 *
 * Body JSON:
 *   message (required for auto-extract), chat_id, chat_type, sender_id
 * Optional: zoom_url (if set and valid, used when message has no link)
 */
export async function POST(req: NextRequest) {
  if (!requireRelaySecret(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await processInboundZoomMessage({
    message: String(body.message || ""),
    chat_id: String(body.chat_id || ""),
    chat_type: String(body.chat_type || "dm"),
    sender_id: String(body.sender_id || ""),
    meeting_id: body.meeting_id != null ? String(body.meeting_id) : undefined,
    title: body.title != null ? String(body.title) : undefined,
    source: body.source != null ? String(body.source) : "whatsapp_inbound_webhook",
    zoom_url: body.zoom_url != null ? String(body.zoom_url) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  if (result.skipped) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: result.reason,
    });
  }

  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "";
  return NextResponse.json({
    ok: true,
    relay_job_id: result.relay_job_id,
    status: "pending",
    poll_url: `${base}${result.poll_path}`,
  });
}
