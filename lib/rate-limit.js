import { createHash, randomBytes } from "node:crypto";

export const RATE_LIMIT = 30;
export const RATE_WINDOW_SECONDS = 600;

const fallbackSalt = randomBytes(16).toString("hex");

export function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export function hashIp(ip, salt = process.env.IP_HASH_SALT || fallbackSalt) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function isRateLimited(redis, req, now = Date.now()) {
  const window = Math.floor(now / 1000 / RATE_WINDOW_SECONDS);
  const key = `ratelimit:${hashIp(clientIp(req))}:${window}`;
  const [count] = await redis.multi().incr(key).expire(key, RATE_WINDOW_SECONDS).exec();
  return Number(count) > RATE_LIMIT;
}
