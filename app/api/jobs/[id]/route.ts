import { NextRequest, NextResponse } from "next/server";
import { getRedis, jobKey } from "@/lib/redis";
import { parseRelayJobFromRedis } from "@/lib/parse-job";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const redis = getRedis();
    const raw = await redis.get(jobKey(id));
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const job = parseRelayJobFromRedis(raw);
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
