"use server";

import { redirect } from "next/navigation";
import { appConfig } from "../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../lib/server-session";

export async function assignTrainingFromPriorityAction(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_3")) {
    redirect("/");
  }

  const trainingId = String(formData.get("trainingId") || "").trim();
  const userIds = formData
    .getAll("userIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const fallbackUserId = String(formData.get("userId") || "").trim();
  const finalUserIds = userIds.length > 0 ? userIds : (fallbackUserId ? [fallbackUserId] : []);
  const token = await getAccessTokenFromCookie();

  const nextUrl = new URL("/module-3", "http://localhost");
  nextUrl.searchParams.set("tab", "priority");

  if (!trainingId || finalUserIds.length === 0) {
    nextUrl.searchParams.set("error", "Falta curso o usuario para crear la asignación.");
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}/training-catalog/${trainingId}/enrollments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds: finalUserIds }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    nextUrl.searchParams.set("error", `API ${response.status}: ${text}`);
    redirect(nextUrl.pathname + nextUrl.search);
  }

  const result = await response.json().catch(() => null);
  nextUrl.searchParams.set("assigned", finalUserIds[0] || "");
  nextUrl.searchParams.set("training", trainingId);
  nextUrl.searchParams.set("assignedCount", String(finalUserIds.length));
  if (result?.items?.[0]?.status) {
    nextUrl.searchParams.set("status", String(result.items[0].status));
  }
  redirect(nextUrl.pathname + nextUrl.search);
}
