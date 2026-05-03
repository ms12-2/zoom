import { enqueueRelayJob } from "@/lib/enqueue-job";
import { extractFirstZoomUrl } from "@/lib/extract-zoom";

export type InboundZoomFields = {
  message: string;
  chat_id?: string;
  chat_type?: string;
  sender_id?: string;
  meeting_id?: string;
  title?: string;
  source?: string;
  zoom_url?: string;
};

export type InboundZoomResult =
  | { ok: true; skipped: true; reason: "no_zoom_link" }
  | { ok: true; skipped: false; relay_job_id: string; poll_path: string }
  | { ok: false; error: string };

export async function processInboundZoomMessage(fields: InboundZoomFields): Promise<InboundZoomResult> {
  try {
    const message = String(fields.message || "");
    const explicit = String(fields.zoom_url || "").trim();
    const zoom_url =
      extractFirstZoomUrl(message) || (explicit.includes("zoom.us/") ? explicit : "");
    if (!zoom_url) {
      return { ok: true, skipped: true, reason: "no_zoom_link" };
    }
    const now = Math.floor(Date.now() / 1000);
    const { id } = await enqueueRelayJob({
      zoom_url,
      meeting_id: String(fields.meeting_id || `meeting-${now}`).slice(0, 120),
      title: String(fields.title || "Class session").slice(0, 200),
      source: String(fields.source || "whatsapp_inbound").slice(0, 80),
      message,
      chat_type: String(fields.chat_type || "dm"),
      chat_id: String(fields.chat_id || ""),
      sender_id: String(fields.sender_id || ""),
    });
    return { ok: true, skipped: false, relay_job_id: id, poll_path: `/api/jobs/${id}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return { ok: false, error: msg };
  }
}
