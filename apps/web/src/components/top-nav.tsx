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

  // Versión simplificada durante SSR
  if (!mounted) {
    return (
      <header className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="brand">
            <img src="/logo-icon.svg" alt="CyberAware" width="32" height="32" />
            <span>CyberAware</span>
          </Link>
          {/* Menú móvil CSS-only - siempre visible en HTML */}
          <div className="mobile-nav-wrapper">
            <input type="checkbox" id="mobile-menu-toggle" className="mobile-menu-checkbox" />
            <label htmlFor="mobile-menu-toggle" className="mobile-menu-label">
              <span className="hamburger"></span>
            </label>
            <nav className="mobile-menu-css">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="mobile-nav-item">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        {/* Logo */}
        <Link href="/" className="brand">
          <img src="/logo-icon.svg" alt="CyberAware" width="32" height="32" />
          <span>CyberAware</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-only">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`nav-link ${isActive(link.href) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop User Menu */}
        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="locale-selector">
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <Globe size={14} />
          </div>

          <div className="theme-toggle">
            <button onClick={() => setTheme("light")} className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-ghost"}`}>
              <Sun size={16} />
            </button>
            <button onClick={() => setTheme("dark")} className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-ghost"}`}>
              <Moon size={16} />
            </button>
            <button onClick={() => setTheme("system")} className={`btn btn-sm ${theme === "system" ? "btn-primary" : "btn-ghost"}`}>
              <Monitor size={16} />
            </button>
          </div>

          {session && (
            <>
              <div className="user-info">
                <div>{session.email.split("@")[0]}</div>
                <div>{session.tenantSlug}</div>
              </div>
              <Link href="/profile">
                <div className="user-avatar">{session.email[0].toUpperCase()}</div>
              </Link>
              <form method="POST" action="/logout">
                <button type="submit" className="btn btn-ghost btn-sm">Salir</button>
              </form>
            </>
          )}
        </div>

        {/* Mobile Menu - CSS Only */}
        <div className="mobile-nav-wrapper">
          <input type="checkbox" id="mobile-menu-toggle" className="mobile-menu-checkbox" />
          <label htmlFor="mobile-menu-toggle" className="mobile-menu-label" aria-label="Menú">
            <span className="hamburger"></span>
          </label>
          <div className="mobile-menu-dropdown">
            <nav className="mobile-nav-css">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`mobile-nav-item ${isActive(link.href) ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            <div className="mobile-menu-section">
              <span className="mobile-menu-section-title">Idioma</span>
              <div className="mobile-menu-buttons">
                <button 
                  className={`mobile-menu-btn ${locale === 'es' ? 'active' : ''}`}
                  onClick={() => setLocale('es')}
                >
                  🇪🇸 ES
                </button>
                <button 
                  className={`mobile-menu-btn ${locale === 'en' ? 'active' : ''}`}
                  onClick={() => setLocale('en')}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <div className="mobile-menu-section">
              <span className="mobile-menu-section-title">Tema</span>
              <div className="mobile-menu-buttons">
                <button 
                  className={`mobile-menu-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={16} /> Claro
                </button>
                <button 
                  className={`mobile-menu-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={16} /> Oscuro
                </button>
              </div>
            </div>

            {session && (
              <div className="mobile-menu-section mobile-menu-user">
                <Link href="/profile" className="mobile-menu-profile">
                  <div className="user-avatar">{session.email[0].toUpperCase()}</div>
                  <div>
                    <div>{session.email.split("@")[0]}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{session.tenantSlug}</div>
                  </div>
                </Link>
                <form method="POST" action="/logout">
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Cerrar sesión
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
