import { cookies } from "next/headers";
import { appConfig } from "./config";

export type CurrentSession = {
  id: string;
  sub: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];
  mustChangePassword: boolean;
  passwordExpired: boolean;
  enabledModules: string[];
};

export async function getAccessTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("platform_access_token")?.value?.trim() || "";
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const token = await getAccessTokenFromCookie();

  if (!token) {
    return null;
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as CurrentSession;
}
