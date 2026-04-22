import { createClient, RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedisClient() {
  if (client) return client;

  client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  client.on("error", (err) => console.error("Redis Client Error", err));

  await client.connect();
  return client;
}

export async function getCache(key: string) {
  try {
    const redis = await getRedisClient();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 3600) {
  try {
    const redis = await getRedisClient();
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

export async function deleteCache(key: string) {
  try {
    const redis = await getRedisClient();
    await redis.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
  }
}

export async function invalidateCache(pattern: string) {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error("Redis invalidate error:", error);
  }
}
