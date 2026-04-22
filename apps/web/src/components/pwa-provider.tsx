"use client";

import { useEffect, ReactNode } from "react";

export function PWAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service Worker registered:", reg.scope))
        .catch((err) => console.error("[PWA] Service Worker registration failed:", err));
    }
  }, []);

  return <>{children}</>;
}
