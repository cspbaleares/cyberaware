"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ maxWidth: "400px", width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "3rem 2rem", textAlign: "center" }}>
        {/* Icon */}
        <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <WifiOff style={{ width: "48px", height: "48px", color: "#f97316" }} />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--foreground)" }}>
          Sin conexión a Internet
        </h1>

        {/* Description */}
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>
          Parece que has perdido la conexión. Algunas funciones de CyberAware 
          están disponibles offline, pero necesitarás conexión para acceder 
          a datos en tiempo real.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button 
            onClick={handleRefresh}
            style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <RefreshCw style={{ width: "16px", height: "16px" }} />
            Intentar de nuevo
          </button>

          <Link href="/" style={{ display: "block", textDecoration: "none" }}>
            <button 
              style={{ width: "100%", padding: "0.75rem 1rem", background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              <Home style={{ width: "16px", height: "16px" }} />
              Volver al inicio
            </button>
          </Link>
        </div>

        {/* Cached content info */}
        <div style={{ marginTop: "2rem", padding: "1rem", background: "var(--muted)", borderRadius: "0.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            <strong style={{ color: "var(--foreground)" }}>Contenido disponible offline:</strong>
          </p>
          <ul style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem", listStyle: "none", textAlign: "left" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>• Página de inicio</li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>• Perfil de usuario</li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>• Dashboard (datos cacheados)</li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>• Formularios (se sincronizarán al reconectar)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
