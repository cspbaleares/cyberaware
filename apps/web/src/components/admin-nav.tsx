"use client";

import Link from "next/link";
import { ChevronLeft, Home, Shield, Users, Activity, Bell, Database, Server, BarChart3, LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export function AdminNav() {
  const pathname = usePathname();
  
  const navItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/admin", icon: <Home size={18} /> },
    { label: "Usuarios", href: "/admin/users", icon: <Users size={18} /> },
    { label: "Métricas", href: "/admin/metrics", icon: <BarChart3 size={18} /> },
    { label: "Auditoría", href: "/admin/audit", icon: <Shield size={18} /> },
    { label: "Caché", href: "/admin/cache", icon: <Database size={18} /> },
    { label: "WebSockets", href: "/admin/websockets", icon: <Bell size={18} /> },
    { label: "Servidor", href: "/admin/server", icon: <Server size={18} /> },
  ];

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "0.5rem",
      marginBottom: "1.5rem",
      padding: "0.75rem 1rem",
      background: "var(--surface-default)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-default)",
      flexWrap: "wrap"
    }}>
      <Link 
        href="/" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
          color: "var(--text-secondary)",
          textDecoration: "none",
          fontSize: "0.875rem"
        }}
      >
        <Home size={16} />
        Inicio
      </Link>
      
      <span style={{ color: "var(--text-muted)" }}>/</span>
      
      <Link 
        href="/admin" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
          color: pathname === "/admin" ? "var(--brand-400)" : "var(--text-secondary)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: pathname === "/admin" ? 600 : 400
        }}
      >
        <Shield size={16} />
        Admin
      </Link>

      {pathname !== "/admin" && (
        <>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ 
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            fontWeight: 500
          }}>
            {navItems.find(item => item.href === pathname)?.label || "Página"}
          </span>
        </>
      )}

      <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
        <Link
          href="/admin"
          style={{
            padding: "0.5rem 0.75rem",
            background: pathname === "/admin" ? "var(--brand-500)" : "transparent",
            color: pathname === "/admin" ? "white" : "var(--text-secondary)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
        <Link
          href="/admin/users"
          style={{
            padding: "0.5rem 0.75rem",
            background: pathname.startsWith("/admin/users") ? "var(--brand-500)" : "transparent",
            color: pathname.startsWith("/admin/users") ? "white" : "var(--text-secondary)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <Users size={16} />
          Usuarios
        </Link>
      </div>
    </div>
  );
}

export function BackButton({ href = "/admin", label = "Volver" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        background: "var(--surface-default)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-primary)",
        textDecoration: "none",
        fontSize: "0.875rem",
        marginBottom: "1rem"
      }}
    >
      <ChevronLeft size={18} />
      {label}
    </Link>
  );
}
