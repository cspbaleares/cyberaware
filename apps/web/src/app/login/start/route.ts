import { NextResponse } from "next/server";
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
  const formData = await request.formData();
  const tenantSlug = String(formData.get("tenantSlug") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug, email, password }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.message || `Login failed (${response.status})`;
      const baseUrl = getRequestBaseUrl(request);
      const url = new URL("/login", baseUrl);
      url.searchParams.set("tenantSlug", tenantSlug);
      url.searchParams.set("email", email);
      url.searchParams.set("error", encodeURIComponent(String(message)));
      return NextResponse.redirect(url, 303);
    }

    if (payload.accessToken) {
      // Decodificar token para obtener tenantSlug y roles
      let tenantSlugFromToken = "";
      let isAdmin = false;
      try {
        const tokenPayload = JSON.parse(atob(payload.accessToken.split('.')[1]));
        tenantSlugFromToken = tokenPayload.tenantSlug || "";
        isAdmin = tokenPayload.isSuperAdmin || 
          (tokenPayload.roles || []).some((role: string) => 
            role.includes("admin") || role === "platform_admin" || role === "tenant_admin"
          );
      } catch {
        // Si no se puede decodificar, usar valores por defecto
      }

      const baseUrl = getRequestBaseUrl(request);
      // Redirigir al dashboard del tenant específico
      const redirectPath = tenantSlugFromToken 
        ? (isAdmin ? `/${tenantSlugFromToken}/admin` : `/${tenantSlugFromToken}/dashboard`)
        : (isAdmin ? "/admin" : "/");
      const res = NextResponse.redirect(new URL(redirectPath, baseUrl), 303);
      res.cookies.set("platform_access_token", payload.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });
      return res;
    }

    if (payload.mfaRequired && payload.mfaToken) {
      const baseUrl = getRequestBaseUrl(request);
      const url = new URL("/login", baseUrl);
      url.searchParams.set("step", "mfa");
      url.searchParams.set("tenantSlug", tenantSlug);
      url.searchParams.set("email", email);
      url.searchParams.set("mustChangePassword", String(payload.mustChangePassword ?? false));
      url.searchParams.set("passwordExpired", String(payload.passwordExpired ?? false));

      const res = NextResponse.redirect(url, 303);
      res.cookies.set("platform_mfa_token", payload.mfaToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });
      return res;
    }

    const baseUrl = getRequestBaseUrl(request);
    const fallback = new URL("/login", baseUrl);
    fallback.searchParams.set("tenantSlug", tenantSlug);
    fallback.searchParams.set("email", email);
    fallback.searchParams.set("error", encodeURIComponent("Respuesta de autenticación no soportada"));
    return NextResponse.redirect(fallback, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const baseUrl = getRequestBaseUrl(request);
    const url = new URL("/login", baseUrl);
    url.searchParams.set("tenantSlug", tenantSlug);
    url.searchParams.set("email", email);
    url.searchParams.set("error", encodeURIComponent(message));
    return NextResponse.redirect(url, 303);
  }
}
