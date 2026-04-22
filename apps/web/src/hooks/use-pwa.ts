"use client";

import { useState, useEffect, useCallback } from "react";

interface NetworkState {
  isOnline: boolean;
  isOffline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  });

  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true, isOffline: false }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false, isOffline: true }));
    };

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setState((prev) => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }));
      }
    };

    // Initial state
    handleOnline();
    updateConnectionInfo();

    // Event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", updateConnectionInfo);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", updateConnectionInfo);
      }
    };
  }, []);

  return state;
}

// Hook for registering service worker
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] Service Worker registered:", registration.scope);
        setIsRegistered(true);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available
                console.log("[PWA] New version available");
                if (window.confirm("Nueva versión disponible. ¿Actualizar ahora?")) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (err) {
        console.error("[PWA] Service Worker registration failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    registerSW();
  }, []);

  return { isRegistered, error };
}

// Hook for background sync
export function useBackgroundSync() {
  const sync = useCallback(async (tag: string) => {
    if ("serviceWorker" in navigator && "sync" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log("[PWA] Background sync registered:", tag);
      } catch (err) {
        console.error("[PWA] Background sync failed:", err);
      }
    }
  }, []);

  return { sync };
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    }
  }, [permission]);

  return { permission, requestPermission, sendNotification };
}

// Install prompt for PWA
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return false;

    prompt.prompt();
    const result = await prompt.userChoice;
    setPrompt(null);
    setIsInstallable(false);
    return result.outcome === "accepted";
  }, [prompt]);

  return { isInstallable, install };
}
