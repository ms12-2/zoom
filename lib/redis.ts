import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Create a free Redis on https://upstash.com and add both to Vercel env."
      );
    }
    client = new Redis({ url, token });
  }
  return client;
}

export const QUEUE_KEY = "nexus-relay:queue";
export const jobKey = (id: string) => `nexus-relay:job:${id}`;
