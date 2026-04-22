"use client";

import { useEffect } from "react";
import { useServiceWorker, useNetworkState } from "@/hooks/use-pwa";
import { WifiOff, Wifi } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isRegistered } = useServiceWorker();
  const { isOnline, isOffline } = useNetworkState();

  useEffect(() => {
    if (isRegistered) {
      console.log("[PWA] Service Worker registered successfully");
    }
  }, [isRegistered]);

  return (
    <>
      {children}
      {/* Network status indicator */}
      <div
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          isOffline
            ? "bg-red-500/90 text-white shadow-lg shadow-red-500/30"
            : "bg-green-500/90 text-white opacity-0 pointer-events-none"
        }`}
      >
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Sin conexión</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4" />
            <span>Conectado</span>
          </>
        )}
      </div>
    </>
  );
}
