"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";
import { useI18n, type Locale } from "./i18n-provider";
import { Sun, Moon, Monitor, Globe, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const enabled = session?.enabledModules?.filter((m) => m in moduleMeta) ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLinks = !session ? [
    { href: "/", label: "Inicio" },
    { href: "/login", label: "Acceder" },
  ] : [
    { href: "/", label: "Dashboard" },
    ...enabled.map((module) => ({ href: moduleMeta[module].href, label: moduleMeta[module].label })),
    ...(session.isSuperAdmin || session.roles.includes("platform_admin") 
      ? [{ href: "/platform/tenants", label: "Plataforma" }] 
      : []),
  ];

  if (!mounted) {
    return (
      <header style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "#0B0F19",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 16px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
            <img src="/logo-icon.svg" alt="CyberAware" width="32" height="32" />
            <span style={{ fontWeight: 600 }}>CyberAware</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "#0B0F19",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 16px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
            <img src="/logo-icon.svg" alt="CyberAware" width="32" height="32" />
            <span className="brand-text" style={{ fontWeight: 600 }}>CyberAware</span>
          </Link>

          {/* Desktop Navigation */}
          <nav style={{ display: "flex", gap: "24px" }} className="desktop-nav">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                style={{
                  textDecoration: "none",
                  color: isActive(link.href) ? "#60a5fa" : "#d1d5db",
                  fontWeight: isActive(link.href) ? 600 : 400,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="desktop-menu">
            <div style={{ position: "relative" }}>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                style={{ 
                  padding: "8px 32px 8px 12px", 
                  borderRadius: "6px", 
                  background: "#111827", 
                  border: "1px solid rgba(255, 255, 255, 0.1)", 
                  color: "white", 
                  cursor: "pointer", 
                  fontSize: "14px" 
                }}
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <Globe size={14} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
            </div>

            <div style={{ display: "flex", gap: "4px", background: "#1f2937", padding: "4px", borderRadius: "8px" }}>
              <button onClick={() => setTheme("light")} style={{ padding: "6px", background: theme === "light" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer", color: "white" }}>
                <Sun size={16} />
              </button>
              <button onClick={() => setTheme("dark")} style={{ padding: "6px", background: theme === "dark" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer", color: "white" }}>
                <Moon size={16} />
              </button>
              <button onClick={() => setTheme("system")} style={{ padding: "6px", background: theme === "system" ? "#3b82f6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer", color: "white" }}>
                <Monitor size={16} />
              </button>
            </div>

            {session && (
              <>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>{session.email.split("@")[0]}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{session.tenantSlug}</div>
                </div>
                <Link href="/profile">
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "white" }}>
                    {session.email[0].toUpperCase()}
                  </div>
                </Link>
                <form method="POST" action="/logout">
                  <button type="submit" style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", cursor: "pointer", color: "white", fontSize: "14px" }}>Salir</button>
                </form>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "none",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "12px",
              cursor: "pointer",
              color: "white",
            }}
            className="mobile-menu-btn"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu - Simple div at root level */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu-root"
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "#0B0F19",
            zIndex: 99,
            padding: "16px",
            overflowY: "auto",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "16px",
                  fontSize: "18px",
                  fontWeight: 500,
                  color: isActive(link.href) ? "#60a5fa" : "#f9fafb",
                  textDecoration: "none",
                  borderRadius: "8px",
                  background: isActive(link.href) ? "rgba(59, 130, 246, 0.2)" : "#111827",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "16px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px", textTransform: "uppercase" }}>Idioma</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setLocale("es")}
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  background: locale === "es" ? "#3b82f6" : "#111827",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "16px"
                }}
              >
                🇪🇸 Español
              </button>
              <button 
                onClick={() => setLocale("en")}
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  background: locale === "en" ? "#3b82f6" : "#111827",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "16px"
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "16px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px", textTransform: "uppercase" }}>Tema</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setTheme("light")}
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  background: theme === "light" ? "#3b82f6" : "#111827",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "14px"
                }}
              >
                <Sun size={18} /> Claro
              </button>
              <button 
                onClick={() => setTheme("dark")}
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  background: theme === "dark" ? "#3b82f6" : "#111827",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "14px"
                }}
              >
                <Moon size={18} /> Oscuro
              </button>
            </div>
          </div>

          {session && (
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "16px" }}>
              <Link 
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px",
                  padding: "16px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "white",
                  background: "#111827",
                  marginBottom: "8px"
                }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  {session.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{session.email.split("@")[0]}</div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>{session.tenantSlug}</div>
                </div>
              </Link>
              <form method="POST" action="/logout">
                <button type="submit" style={{ width: "100%", padding: "12px", background: "#111827", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", cursor: "pointer", color: "white", fontSize: "16px" }}>
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* CSS for responsive behavior */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .desktop-nav,
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .brand-text {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
