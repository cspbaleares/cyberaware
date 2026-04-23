import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appConfig } from "../../../lib/config";

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
  const cookieStore = await cookies();
  const mfaToken = cookieStore.get("platform_mfa_token")?.value?.trim() || "";
  const formData = await request.formData();
  const tenantSlug = String(formData.get("tenantSlug") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const code = String(formData.get("code") || "").trim();

  if (!mfaToken) {
    const baseUrl = getRequestBaseUrl(request);
    const url = new URL("/login", baseUrl);
    url.searchParams.set("tenantSlug", tenantSlug);
    url.searchParams.set("email", email);
    url.searchParams.set("error", encodeURIComponent("Sesión MFA no disponible"));
    return NextResponse.redirect(url, 303);
  }

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/auth/mfa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mfaToken}`,
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.accessToken) {
      const message = payload?.message || `MFA failed (${response.status})`;
      const baseUrl = getRequestBaseUrl(request);
      const url = new URL("/login", baseUrl);
      url.searchParams.set("step", "mfa");
      url.searchParams.set("tenantSlug", tenantSlug);
      url.searchParams.set("email", email);
      url.searchParams.set("error", encodeURIComponent(String(message)));
      return NextResponse.redirect(url, 303);
    }

    // Decodificar token para verificar si es admin
    let isAdmin = false;
    try {
      const tokenPayload = JSON.parse(atob(payload.accessToken.split('.')[1]));
      isAdmin = tokenPayload.isSuperAdmin || 
        (tokenPayload.roles || []).some((role: string) => 
          role.includes("admin") || role === "platform_admin" || role === "tenant_admin"
        );
    } catch {
      // Si no se puede decodificar, asumir no admin
    }

    const baseUrl = getRequestBaseUrl(request);
    const redirectUrl = isAdmin ? "/admin" : "/";
    const res = NextResponse.redirect(new URL(redirectUrl, baseUrl), 303);
    res.cookies.set("platform_access_token", payload.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    res.cookies.delete("platform_mfa_token");
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const baseUrl = getRequestBaseUrl(request);
    const url = new URL("/login", baseUrl);
    url.searchParams.set("step", "mfa");
    url.searchParams.set("tenantSlug", tenantSlug);
    url.searchParams.set("email", email);
    url.searchParams.set("error", encodeURIComponent(message));
    return NextResponse.redirect(url, 303);
  }
}
