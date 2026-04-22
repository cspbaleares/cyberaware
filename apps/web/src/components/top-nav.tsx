"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";
import { useI18n, type Locale } from "./i18n-provider";
import { Sun, Moon, Monitor, Globe } from "lucide-react";
import { useState, useEffect } from "react";

interface NavProps {
  session?: {
    email: string;
    tenantSlug: string;
    isSuperAdmin: boolean;
    roles: string[];
    enabledModules: string[];
  } | null;
}

const moduleMeta: Record<string, { href: string; label: string; icon: string }> = {
  module_1: { href: "/module-1", label: "Simulación", icon: "M" },
  module_2: { href: "/module-2", label: "Riesgo Humano", icon: "R" },
  module_3: { href: "/module-3", label: "Formación", icon: "F" },
  module_4: { href: "/module-4", label: "Automatización", icon: "A" },
};

export function TopNav({ session }: NavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const enabled = session?.enabledModules?.filter((m) => m in moduleMeta) ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Durante SSR/hydration, mostrar versión simplificada
  if (!mounted) {
    return (
      <header className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="brand">
            <img src="/logo-icon.svg" alt="CyberAware" width="32" height="32" style={{ marginRight: "0.75rem" }} />
            <span>CyberAware</span>
          </Link>
          <nav className="nav-links">
            {!session ? (
              <>
                <Link href="/" className="nav-link">Inicio</Link>
                <Link href="/login" className="nav-link">Acceder</Link>
              </>
            ) : (
              <>
                <Link href="/" className="nav-link">Dashboard</Link>
                {enabled.map((module) => (
                  <Link key={module} href={moduleMeta[module].href} className="nav-link">
                    {moduleMeta[module].label}
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="user-menu" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {session && (
              <>
                <div className="user-info" style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{session.email.split("@")[0]}</div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "white" }}>
                  {session.email[0].toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/" className="brand">
          <img src="/logo-icon.svg" alt="CyberAware" width="32" height="32" style={{ marginRight: "0.75rem" }} />
          <span>CyberAware</span>
        </Link>

        <nav className="nav-links">
          {!session ? (
            <>
              <Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Inicio</Link>
              <Link href="/login" className={`nav-link ${isActive("/login") ? "active" : ""}`}>Acceder</Link>
            </>
          ) : (
            <>
              <Link href="/" className={`nav-link ${isActive("/") && pathname === "/" ? "active" : ""}`}>Dashboard</Link>
              {enabled.map((module) => (
                <Link key={module} href={moduleMeta[module].href} className={`nav-link ${isActive(moduleMeta[module].href) ? "active" : ""}`}>
                  {moduleMeta[module].label}
                </Link>
              ))}
              {(session.isSuperAdmin || session.roles.includes("platform_admin")) && (
                <Link href="/platform/tenants" className={`nav-link ${isActive("/platform") ? "active" : ""}`}>Plataforma</Link>
              )}
            </>
          )}
        </nav>

        <div className="user-menu" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ position: "relative" }}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              style={{ padding: "0.5rem 2rem 0.5rem 0.75rem", borderRadius: "0.375rem", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer", fontSize: "0.875rem" }}
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <Globe size={14} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
          </div>

          <div style={{ display: "flex", gap: "0.25rem", background: "var(--muted)", padding: "0.25rem", borderRadius: "0.5rem" }}>
            <button onClick={() => setTheme("light")} className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "0.4rem" }} title="Tema claro">
              <Sun size={16} />
            </button>
            <button onClick={() => setTheme("dark")} className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "0.4rem" }} title="Tema oscuro">
              <Moon size={16} />
            </button>
            <button onClick={() => setTheme("system")} className={`btn btn-sm ${theme === "system" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "0.4rem" }} title="Tema del sistema">
              <Monitor size={16} />
            </button>
          </div>

          {session && (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{session.email.split("@")[0]}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{session.tenantSlug}</div>
              </div>
              <Link href="/profile" title="Ver perfil" style={{ textDecoration: "none" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "white" }}>
                  {session.email[0].toUpperCase()}
                </div>
              </Link>
              <form method="POST" action="/logout">
                <button type="submit" className="btn btn-ghost btn-sm">Salir</button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
