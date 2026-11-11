import { Redis } from "@upstash/redis";
import { MemoryRedis } from "./memory-redis";

export function hasUpstashConfig(env = process.env) {
  return Boolean(
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) ||
    (env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  );
}

function createClient() {
  if (hasUpstashConfig()) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
    });
  }
  return new MemoryRedis();
}

export function getRedis() {
  globalThis.__guessThePartyRedis ??= createClient();
  return globalThis.__guessThePartyRedis;
}

export function setRedis(client) {
  globalThis.__guessThePartyRedis = client;
}
