"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../lib/server-session";

export async function recalculateTenantRiskAction() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_2")) {
    redirect("/");
  }

  const token = await getAccessTokenFromCookie();
  const nextUrl = new URL("/module-2", "http://localhost");
  nextUrl.searchParams.set("tab", "overview");

  const response = await fetch(`${appConfig.apiBaseUrl}/risk-scoring/tenant/recalculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const result = await response.json().catch(() => null);
  nextUrl.searchParams.set("recalculated", String(result?.totalUsersProcessed ?? 0));
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function recalculateUserRiskAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_2")) {
    redirect("/");
  }

  const userId = String(formData.get("userId") || "").trim();
  const token = await getAccessTokenFromCookie();
  const nextUrl = new URL("/module-2", "http://localhost");
  nextUrl.searchParams.set("tab", "users");

  if (!userId) {
    nextUrl.searchParams.set("error", "Falta el usuario para recalcular riesgo.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/risk-scoring/users/${userId}/recalculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  nextUrl.searchParams.set("recalculatedUser", userId);
  redirect(nextUrl.pathname + nextUrl.search);
}
