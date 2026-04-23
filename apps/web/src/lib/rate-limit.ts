import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests por minuto
};

export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { windowMs, maxRequests } = { ...defaultConfig, ...config };
  
  // Obtener IP del cliente
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const key = `ratelimit:${ip}:${request.nextUrl.pathname}`;
  
  try {
    const redis = await getRedisClient();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Usar Redis para contar requests
    const multi = redis.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zCard(key);
    multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
    multi.pExpire(key, windowMs);
    
    const results = await multi.exec();
    const currentCount = Number(results?.[1]) || 0;
    
    const remaining = Math.max(0, maxRequests - currentCount);
    const success = currentCount < maxRequests;
    
    return {
      success,
      limit: maxRequests,
      remaining,
      reset: now + windowMs,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // En caso de error, permitir el request
    return { success: true, limit: maxRequests, remaining: 1, reset: Date.now() + windowMs };
  }
}

export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  return async function middleware(request: NextRequest) {
    const result = await rateLimit(request, config);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((result.reset - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
          }
        }
      );
    }
    
    return NextResponse.next();
  };
}
