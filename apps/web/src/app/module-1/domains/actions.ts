"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../../lib/server-session";

function buildBody(formData: FormData) {
  return {
    domain: String(formData.get("domain") || "").trim(),
    type: String(formData.get("type") || "simulation_sender").trim(),
    provider: String(formData.get("provider") || "mailgun").trim() || null,
    fromEmail: String(formData.get("fromEmail") || "").trim() || null,
    fromName: String(formData.get("fromName") || "").trim() || null,
    replyTo: String(formData.get("replyTo") || "").trim() || null,
  };
}

export async function saveDomainAction(formData: FormData) {
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
    ? `${appConfig.apiBaseUrl}/mail-domains/${id}`
    : `${appConfig.apiBaseUrl}/mail-domains`;
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
    const nextUrl = new URL("/module-1/domains", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const saved = await response.json();
  const nextUrl = new URL("/module-1/domains", "http://localhost");
  nextUrl.searchParams.set("saved", String(saved.id || "1"));
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function verifyDomainAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.enabledModules.includes("module_1")) redirect("/");

  const id = String(formData.get("id") || "").trim();
  const token = await getAccessTokenFromCookie();

  const response = await fetch(`${appConfig.apiBaseUrl}/mail-domains/${id}/verify`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/domains", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const nextUrl = new URL("/module-1/domains", "http://localhost");
  nextUrl.searchParams.set("verified", id);
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function archiveDomainAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.enabledModules.includes("module_1")) redirect("/");

  const id = String(formData.get("id") || "").trim();
  const token = await getAccessTokenFromCookie();

  const response = await fetch(`${appConfig.apiBaseUrl}/mail-domains/${id}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/domains", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const nextUrl = new URL("/module-1/domains", "http://localhost");
  nextUrl.searchParams.set("archived", id);
  redirect(nextUrl.pathname + nextUrl.search);
}
