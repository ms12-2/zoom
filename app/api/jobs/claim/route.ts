import { NextRequest, NextResponse } from "next/server";
import { getRedis, QUEUE_KEY, jobKey } from "@/lib/redis";
import { parseRelayJobFromRedis, queueIdFromRedis } from "@/lib/parse-job";
import { requireRelaySecret } from "@/lib/auth";
export async function GET(req: NextRequest) {
  if (!requireRelaySecret(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const redis = getRedis();
    const id = queueIdFromRedis(await redis.rpop(QUEUE_KEY));
    if (!id) {
      return NextResponse.json({ ok: true, job: null });
    }
    const raw = await redis.get(jobKey(id));
    if (!raw) {
      return NextResponse.json({ ok: true, job: null });
    }
    const job = parseRelayJobFromRedis(raw);
    if (job.status !== "pending") {
      await redis.lpush(QUEUE_KEY, id);
      return NextResponse.json({ ok: true, job: null });
    }
    const now = Date.now() / 1000;
    job.status = "claimed";
    job.claimed_at = now;
    job.updated_at = now;
    await redis.set(jobKey(id), JSON.stringify(job));
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
