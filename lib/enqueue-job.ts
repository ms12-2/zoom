import { randomUUID } from "crypto";
import { getRedis, QUEUE_KEY, jobKey } from "@/lib/redis";
import type { RelayJob } from "@/lib/types";

export type EnqueueInput = {
  zoom_url: string;
  meeting_id?: string;
  title?: string;
  source?: string;
  message?: string;
  chat_type?: string;
  chat_id?: string;
  sender_id?: string;
};

export async function enqueueRelayJob(input: EnqueueInput): Promise<{ id: string }> {
  const zoom_url = String(input.zoom_url || "").trim();
  if (!zoom_url.includes("zoom.us/")) {
    throw new Error("zoom_url must contain zoom.us/");
  }
  const now = Date.now() / 1000;
  const id = randomUUID();
  const job: RelayJob = {
    id,
    zoom_url,
    meeting_id: String(input.meeting_id || `meeting-${Math.floor(now)}`).slice(0, 120),
    title: String(input.title || "Class session").slice(0, 200),
    source: String(input.source || "vercel_relay").slice(0, 80),
    message: String(input.message || ""),
    chat_type: String(input.chat_type || "web"),
    chat_id: String(input.chat_id || ""),
    sender_id: String(input.sender_id || ""),
    status: "pending",
    created_at: now,
    updated_at: now,
  };
  const redis = getRedis();
  await redis.set(jobKey(id), JSON.stringify(job));
  await redis.lpush(QUEUE_KEY, id);
  return { id };
}
