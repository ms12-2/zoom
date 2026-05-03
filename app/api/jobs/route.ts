import { NextRequest, NextResponse } from "next/server";
import { enqueueRelayJob } from "@/lib/enqueue-job";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const zoom_url = String(body.zoom_url || "").trim();
    if (!zoom_url.includes("zoom.us/")) {
      return bad("zoom_url must contain zoom.us/");
    }
    const now = Date.now() / 1000;
    const { id } = await enqueueRelayJob({
      zoom_url,
      meeting_id: String(body.meeting_id || `meeting-${Math.floor(now)}`).slice(0, 120),
      title: String(body.title || "Class session").slice(0, 200),
      source: String(body.source || "vercel_relay").slice(0, 80),
      message: String(body.message || ""),
      chat_type: String(body.chat_type || "web"),
      chat_id: String(body.chat_id || ""),
      sender_id: String(body.sender_id || ""),
    });
    return NextResponse.json({
      ok: true,
      relay_job_id: id,
      status: "pending",
      poll_url: `/api/jobs/${id}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
