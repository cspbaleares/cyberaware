"use client";

import Link from "next/link";

// Icons
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

export default function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: 480 }}>
        <div className="empty-state" style={{ padding: "2rem" }}>
          <div className="empty-state-icon" style={{ 
            width: 80, 
            height: 80, 
            background: "linear-gradient(135deg, var(--warning-500), var(--error-500))",
            borderRadius: "var(--radius-2xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem"
          }}>
            <span style={{ fontSize: 40 }}>404</span>
          </div>
          
          <h1 style={{ 
            fontSize: "var(--text-3xl)", 
            fontWeight: 700, 
            color: "var(--text-primary)",
            marginBottom: "0.5rem"
          }}>
            Página no encontrada
          </h1>
          
          <p style={{ 
            fontSize: "var(--text-base)", 
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            lineHeight: 1.6
          }}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/" className="btn btn-primary">
              <HomeIcon /> Volver al inicio
            </Link>
            <button onClick={() => window.history.back()} className="btn btn-secondary">
              <ArrowLeftIcon /> Ir atrás
            </button>
          </div>

          <div style={{ 
            marginTop: "2rem", 
            paddingTop: "2rem", 
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              ¿Necesitas ayuda?
            </p>
            <Link href="/login" style={{ color: "var(--brand-400)", fontSize: "var(--text-sm)" }}>
              Contactar con soporte →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
