"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

import { createContext, useContext, ReactNode } from "react";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "info", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={20} style={{ color: "#22c55e" }} />,
    error: <AlertCircle size={20} style={{ color: "#ef4444" }} />,
    warning: <AlertCircle size={20} style={{ color: "#f97316" }} />,
    info: <Info size={20} style={{ color: "#06b6d4" }} />,
  };

  const backgrounds = {
    success: "rgba(34, 197, 94, 0.1)",
    error: "rgba(239, 68, 68, 0.1)",
    warning: "rgba(249, 115, 22, 0.1)",
    info: "rgba(6, 182, 212, 0.1)",
  };

  const borders = {
    success: "rgba(34, 197, 94, 0.3)",
    error: "rgba(239, 68, 68, 0.3)",
    warning: "rgba(249, 115, 22, 0.3)",
    info: "rgba(6, 182, 212, 0.3)",
  };

  return (
    <div style={{
      position: "fixed",
      top: "1rem",
      right: "1rem",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      maxWidth: "400px",
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            background: backgrounds[toast.type],
            border: `1px solid ${borders[toast.type]}`,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {icons[toast.type]}
          <span style={{ flex: 1, fontSize: "0.875rem" }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              opacity: 0.5,
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
