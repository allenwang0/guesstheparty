import { Redis } from "@upstash/redis";
import { MemoryRedis } from "./memory-redis";

export function hasUpstashConfig(env = process.env) {
  return Boolean(
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) ||
    (env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  );
}

async function createClient() {
  if (hasUpstashConfig()) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
    });
  }
  const memory = new MemoryRedis();
  if (process.env.GTP_SAMPLE_DATA === "1") {
    const [{ seedSample }, { MEMBERS }] = await Promise.all([import("./sample-data"), import("./members")]);
    await seedSample(memory, MEMBERS);
  }
  return memory;
}

export function getRedis() {
  globalThis.__guessThePartyRedis ??= createClient();
  return globalThis.__guessThePartyRedis;
}

export function setRedis(client) {
  globalThis.__guessThePartyRedis = Promise.resolve(client);
}
