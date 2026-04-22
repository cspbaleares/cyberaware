"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/toast-provider";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || "", {
        path: "/api/socket",
      });
    }

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    // Escuchar alertas de seguridad
    socket.on("security-alert", (data) => {
      addToast(
        `Alerta de seguridad: ${data.message}`,
        "warning",
        10000
      );
    });

    // Escuchar notificaciones generales
    socket.on("notification", (data) => {
      addToast(data.message, data.type || "info", data.duration || 5000);
    });

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("security-alert");
      socket?.off("notification");
    };
  }, [addToast]);

  const joinTenant = useCallback((tenantId: string) => {
    socket?.emit("join-tenant", tenantId);
  }, []);

  const joinUser = useCallback((userId: string) => {
    socket?.emit("join-user", userId);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socket?.emit(event, data);
  }, []);

  return {
    socket,
    isConnected,
    joinTenant,
    joinUser,
    emit,
  };
}
