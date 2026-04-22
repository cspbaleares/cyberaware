"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// Icons
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          background: "rgba(16, 185, 129, 0.15)",
          borderColor: "rgba(16, 185, 129, 0.3)",
          color: "var(--success-500)",
          icon: <CheckIcon />,
        };
      case "error":
        return {
          background: "rgba(239, 68, 68, 0.15)",
          borderColor: "rgba(239, 68, 68, 0.3)",
          color: "var(--error-500)",
          icon: <AlertIcon />,
        };
      case "warning":
        return {
          background: "rgba(245, 158, 11, 0.15)",
          borderColor: "rgba(245, 158, 11, 0.3)",
          color: "var(--warning-500)",
          icon: <AlertIcon />,
        };
      default:
        return {
          background: "rgba(59, 130, 246, 0.15)",
          borderColor: "rgba(59, 130, 246, 0.3)",
          color: "var(--brand-400)",
          icon: <AlertIcon />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxWidth: "400px",
        }}
      >
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                background: styles.background,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: "var(--radius-xl)",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "var(--shadow-lg)",
                animation: "slideIn 0.3s ease-out",
              }}
            >
              <span style={{ color: styles.color, flexShrink: 0 }}>
                {styles.icon}
              </span>
              <span
                style={{
                  color: "var(--text-primary)",
                  fontSize: "var(--text-sm)",
                  flex: 1,
                }}
              >
                {toast.message}
              </span>
              <button
                onClick={() => hideToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XIcon />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
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
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
