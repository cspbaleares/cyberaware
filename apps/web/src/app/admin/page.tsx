import Link from "next/link";
import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  GraduationCap, 
  Activity,
  Settings,
  Bell,
  Database,
  Server
} from "lucide-react";

export default function AdminPage() {
  const adminModules = [
    {
      title: "Dashboard de Métricas",
      description: "Monitoreo en tiempo real del sistema",
      icon: <Activity size={32} />,
      href: "/admin/metrics",
      color: "#06b6d4",
    },
    {
      title: "Gestión de Usuarios",
      description: "Administrar usuarios y permisos",
      icon: <Users size={32} />,
      href: "/admin/users",
      color: "#8b5cf6",
    },
    {
      title: "Configuración de Seguridad",
      description: "CSP, rate limiting y headers",
      icon: <Shield size={32} />,
      href: "/admin/security",
      color: "#22c55e",
    },
    {
      title: "Caché y Redis",
      description: "Gestión de caché y conexiones",
      icon: <Database size={32} />,
      href: "/admin/cache",
      color: "#f97316",
    },
    {
      title: "WebSockets",
      description: "Notificaciones en tiempo real",
      icon: <Bell size={32} />,
      href: "/admin/websockets",
      color: "#ec4899",
    },
    {
      title: "Servidor",
      description: "Estado y configuración del servidor",
      icon: <Server size={32} />,
      href: "/admin/server",
      color: "#10b981",
    },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Panel de Administración
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          Gestiona la plataforma y monitorea el rendimiento
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
      }}>
        {adminModules.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              className="card"
              style={{
                padding: "1.5rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: `${module.color}20`,
                  color: module.color,
                }}
              >
                {module.icon}
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {module.title}
                </h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                  {module.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* System Status */}
      <div className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LayoutDashboard size={20} />
          Estado del Sistema
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}>
          <StatusItem label="Servidor Web" status="online" />
          <StatusItem label="API Backend" status="online" />
          <StatusItem label="Base de Datos" status="online" />
          <StatusItem label="Redis Caché" status="online" />
          <StatusItem label="WebSockets" status="online" />
          <StatusItem label="SSL Certificate" status="online" />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: "online" | "offline" | "warning" }) {
  const colors = {
    online: "#22c55e",
    offline: "#ef4444",
    warning: "#f97316",
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.75rem",
      background: "var(--muted)",
      borderRadius: "0.5rem",
    }}>
      <div style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: colors[status],
        boxShadow: `0 0 8px ${colors[status]}`,
      }} />
      <span style={{ fontSize: "0.875rem" }}>{label}</span>
      <span style={{
        marginLeft: "auto",
        fontSize: "0.75rem",
        color: colors[status],
        textTransform: "uppercase",
        fontWeight: 600,
      }}>
        {status}
      </span>
    </div>
  );
}
