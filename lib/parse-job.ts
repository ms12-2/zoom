import type { RelayJob } from "./types";

/**
 * Upstash `get` may return a JSON string or an already-parsed object.
 * `JSON.parse(object)` stringifies to "[object Object]" and throws — avoid that.
 */
export function parseRelayJobFromRedis(raw: unknown): RelayJob {
  if (raw == null) {
    throw new Error("Missing job data");
  }
  if (typeof raw === "string") {
    return JSON.parse(raw) as RelayJob;
  }
  if (typeof raw === "object") {
    return raw as RelayJob;
  }
  throw new Error("Invalid job data type");
}

/** Queue stores job ids as strings; coerce defensively. */
export function queueIdFromRedis(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    return s || null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  return null;
}
