import { NextRequest, NextResponse } from "next/server";
import { getRedis, jobKey } from "@/lib/redis";
import { parseRelayJobFromRedis } from "@/lib/parse-job";
import { requireRelaySecret } from "@/lib/auth";
type Ctx = { params: Promise<{ id: string }> };

/** Called by the local poller after /start returns local_job_id. */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!requireRelaySecret(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const local_job_id = String(body.local_job_id || "").trim();
    if (!local_job_id) {
      return NextResponse.json({ ok: false, error: "local_job_id required" }, { status: 400 });
    }
    const redis = getRedis();
    const raw = await redis.get(jobKey(id));
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const job = parseRelayJobFromRedis(raw);
    const now = Date.now() / 1000;
    job.status = "running_local";
    job.local_job_id = local_job_id;
    job.updated_at = now;
    await redis.set(jobKey(id), JSON.stringify(job));
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
