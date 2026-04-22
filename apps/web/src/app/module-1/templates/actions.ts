"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../../lib/server-session";

function buildBody(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    subject: String(formData.get("subject") || "").trim(),
    senderName: String(formData.get("senderName") || "").trim() || null,
    senderEmail: String(formData.get("senderEmail") || "").trim() || null,
    landingUrl: String(formData.get("landingUrl") || "").trim() || null,
    htmlBody: String(formData.get("htmlBody") || ""),
    status: String(formData.get("status") || "draft").trim() || "draft",
  };
}

export async function saveTemplateAction(formData: FormData) {
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
    ? `${appConfig.apiBaseUrl}/phishing-templates/${id}`
    : `${appConfig.apiBaseUrl}/phishing-templates`;
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
    const nextUrl = new URL("/module-1/templates", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const saved = await response.json();
  const nextUrl = new URL("/module-1/templates", "http://localhost");
  nextUrl.searchParams.set("saved", String(saved.id || "1"));
  redirect(nextUrl.pathname + nextUrl.search);
}

export async function archiveTemplateAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  const id = String(formData.get("id") || "").trim();
  const token = await getAccessTokenFromCookie();

  const response = await fetch(`${appConfig.apiBaseUrl}/phishing-templates/${id}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const nextUrl = new URL("/module-1/templates", "http://localhost");
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const nextUrl = new URL("/module-1/templates", "http://localhost");
  nextUrl.searchParams.set("archived", id);
  redirect(nextUrl.pathname + nextUrl.search);
}
