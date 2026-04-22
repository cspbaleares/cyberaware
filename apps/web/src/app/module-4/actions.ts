"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../lib/server-session";

export async function createAutomationRuleAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_4")) {
    redirect("/");
  }

  const token = await getAccessTokenFromCookie();
  const title = String(formData.get("title") || "").trim();
  const triggerType = String(formData.get("triggerType") || "").trim();
  const actionType = String(formData.get("actionType") || "").trim();
  const priority = String(formData.get("priority") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const targetTrainingId = String(formData.get("targetTrainingId") || "").trim();
  const targetModuleKey = String(formData.get("targetModuleKey") || "").trim();
  const cooldownMinutes = Number(String(formData.get("cooldownMinutes") || "120").trim() || "120");
  const isEnabled = String(formData.get("isEnabled") || "true") !== "false";

  const nextUrl = new URL("/module-4", "http://localhost");

  if (!title || !triggerType || !actionType || !priority) {
    nextUrl.searchParams.set("error", "Faltan campos obligatorios para crear la regla.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/automation/rules`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      triggerType,
      actionType,
      priority,
      description: description || undefined,
      targetTrainingId: targetTrainingId || undefined,
      targetModuleKey: targetModuleKey || undefined,
      cooldownMinutes,
      isEnabled,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const result = await response.json().catch(() => null);
  nextUrl.searchParams.set("created", result?.id || "ok");
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function toggleAutomationRuleAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_4")) {
    redirect("/");
  }

  const token = await getAccessTokenFromCookie();
  const ruleId = String(formData.get("ruleId") || "").trim();
  const isEnabled = String(formData.get("isEnabled") || "false") === "true";
  const nextUrl = new URL("/module-4", "http://localhost");

  if (!ruleId) {
    nextUrl.searchParams.set("error", "Falta la regla a actualizar.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/automation/rules/${ruleId}/toggle`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isEnabled }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  nextUrl.searchParams.set("updated", ruleId);
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function resolveInterventionAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_4")) {
    redirect("/");
  }

  const token = await getAccessTokenFromCookie();
  const interventionId = String(formData.get("interventionId") || "").trim();
  const resolutionNote = String(formData.get("resolutionNote") || "").trim();
  const nextUrl = new URL("/module-4", "http://localhost");

  if (!interventionId) {
    nextUrl.searchParams.set("error", "Falta la intervención a resolver.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/automation/interventions/${interventionId}/resolve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resolutionNote: resolutionNote || undefined }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  nextUrl.searchParams.set("resolved", interventionId);
  redirect(nextUrl.pathname + nextUrl.search);
}
