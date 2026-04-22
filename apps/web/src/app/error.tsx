"use client";

import Link from "next/link";
import { useEffect } from "react";

// Icons
const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <polyline points="23,4 23,10 17,10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: 480 }}>
        <div className="empty-state" style={{ padding: "2rem" }}>
          <div className="empty-state-icon" style={{ 
            width: 80, 
            height: 80, 
            background: "linear-gradient(135deg, var(--error-500), var(--error-600))",
            borderRadius: "var(--radius-2xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem"
          }}>
            <AlertTriangleIcon />
          </div>
          
          <h1 style={{ 
            fontSize: "var(--text-3xl)", 
            fontWeight: 700, 
            color: "var(--text-primary)",
            marginBottom: "0.5rem"
          }}>
            Ha ocurrido un error
          </h1>
          
          <p style={{ 
            fontSize: "var(--text-base)", 
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            lineHeight: 1.6
          }}>
            Lo sentimos, algo ha salido mal. Estamos trabajando para solucionarlo.
          </p>

          {error?.digest && (
            <div style={{ 
              background: "var(--bg-secondary)", 
              padding: "1rem", 
              borderRadius: "var(--radius-lg)",
              marginBottom: "2rem",
              fontFamily: "monospace",
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)"
            }}>
              Error ID: {error.digest}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={reset} className="btn btn-primary">
              <RefreshIcon /> Intentar de nuevo
            </button>
            <Link href="/" className="btn btn-secondary">
              <HomeIcon /> Volver al inicio
            </Link>
          </div>

          <div style={{ 
            marginTop: "2rem", 
            paddingTop: "2rem", 
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Si el problema persiste, contacta con soporte
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "monospace" }}>
              {new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
