"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../../lib/server-session";

function buildBody(formData: FormData) {
  const scheduledAtValue = String(formData.get("scheduledAt") || "").trim();

  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    status: String(formData.get("status") || "draft").trim() || "draft",
    scheduledAt: scheduledAtValue ? new Date(scheduledAtValue).toISOString() : null,
    mailDomainId: String(formData.get("mailDomainId") || "").trim() || null,
    templateId: String(formData.get("templateId") || "").trim() || null,
  };
}

export async function saveCampaignAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  const id = String(formData.get("id") || "").trim();
  const body = buildBody(formData);
  const token = await getAccessTokenFromCookie();

  const url = id
    ? `${appConfig.apiBaseUrl}/phishing-simulations/${id}`
    : `${appConfig.apiBaseUrl}/phishing-simulations`;
  const method = id ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const saved = await response.json();
  const nextUrl = new URL("/module-1/campaigns", "http://localhost");
  nextUrl.searchParams.set("saved", String(saved.id || "1"));
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function archiveCampaignAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  const id = String(formData.get("id") || "").trim();
  const token = await getAccessTokenFromCookie();

  const response = await fetch(`${appConfig.apiBaseUrl}/phishing-simulations/${id}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const nextUrl = new URL("/module-1/campaigns", "http://localhost");
  nextUrl.searchParams.set("archived", id);
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function assignRecipientsAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  const simulationId = String(formData.get("simulationId") || "").trim();
  const userIds = formData.getAll("userIds").map((value) => String(value).trim()).filter(Boolean);
  const token = await getAccessTokenFromCookie();

  if (!simulationId) {
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("error", "No simulation selected.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  if (userIds.length === 0) {
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("edit", simulationId);
    nextUrl.searchParams.set("error", "Selecciona al menos un usuario.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/phishing-simulations/${simulationId}/recipients`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("edit", simulationId);
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const nextUrl = new URL("/module-1/campaigns", "http://localhost");
  nextUrl.searchParams.set("edit", simulationId);
  nextUrl.searchParams.set("assigned", String(userIds.length));
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function dispatchCampaignAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  const simulationId = String(formData.get("simulationId") || "").trim();
  const force = String(formData.get("force") || "").trim() === "true";
  const token = await getAccessTokenFromCookie();

  if (!simulationId) {
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("error", "No simulation selected.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/simulation-dispatch/${simulationId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ force }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/campaigns", "http://localhost");
    nextUrl.searchParams.set("edit", simulationId);
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const result = await response.json();
  const nextUrl = new URL("/module-1/campaigns", "http://localhost");
  nextUrl.searchParams.set("edit", simulationId);
  nextUrl.searchParams.set("dispatched", String(result.sentCount ?? 0));
  redirect(nextUrl.pathname + nextUrl.search);
}
