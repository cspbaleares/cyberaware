import { NextResponse } from "next/server";

function getRequestBaseUrl(request: Request) {
  const origin = request.headers.get("origin")?.trim();
  if (origin) return origin;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get("host")?.trim();
  if (host) {
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const baseUrl = getRequestBaseUrl(request);
  const res = NextResponse.redirect(new URL("/login", baseUrl), 303);
  res.cookies.delete("platform_access_token");
  res.cookies.delete("platform_mfa_token");
  return res;
}
