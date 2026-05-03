import { NextRequest, NextResponse } from "next/server";
import { getRedis, jobKey } from "@/lib/redis";
import { parseRelayJobFromRedis } from "@/lib/parse-job";
import { requireRelaySecret } from "@/lib/auth";
import type { RelayJob, RelayJobStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!requireRelaySecret(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const redis = getRedis();
    const raw = await redis.get(jobKey(id));
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const job = parseRelayJobFromRedis(raw);
    const now = Date.now() / 1000;
    const status = String(body.status || "completed") as RelayJobStatus;
    job.updated_at = now;
    job.local_job_id = String(body.local_job_id || job.local_job_id || "");
    if (status === "failed") {
      job.status = "failed";
      job.error = String(body.error || "failed").slice(0, 2000);
    } else {
      job.status = "completed";
      job.summary = String(body.summary || "").slice(0, 50000);
      job.error = "";
      if (typeof body.summary_pdf_available === "boolean") {
        job.summary_pdf_available = body.summary_pdf_available;
      }
    }
    await redis.set(jobKey(id), JSON.stringify(job));
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
