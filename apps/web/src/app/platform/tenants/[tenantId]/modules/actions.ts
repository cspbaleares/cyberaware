"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../../../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../../../../lib/server-session";

export async function updateTenantModuleAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.isSuperAdmin && !session.roles.includes("platform_admin")) {
    redirect("/");
  }

  const tenantId = String(formData.get("tenantId") || "").trim();
  const moduleKey = String(formData.get("moduleKey") || "").trim();
  const isEnabled = String(formData.get("isEnabled") || "false") === "true";

  const token = await getAccessTokenFromCookie();

  const response = await fetch(
    `${appConfig.apiBaseUrl}/platform/tenants/${tenantId}/modules/${moduleKey}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isEnabled }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text();
    const url = new URL(`/platform/tenants/${tenantId}/modules`, "http://localhost");
    url.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(url.pathname + url.search);
  }

  const url = new URL(`/platform/tenants/${tenantId}/modules`, "http://localhost");
  url.searchParams.set("saved", "1");
  redirect(url.pathname + url.search);
}
