import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/server-session";
import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  Activity,
  Bell,
  Database,
  Server,
  Home,
  ChevronLeft
} from "lucide-react";

// Forzar renderizado dinámico
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  // Verificar que sea admin
  const isAdmin = session.isSuperAdmin || 
    session.roles?.some((role: string) => 
      role.includes("admin") || role === "platform_admin" || role === "tenant_admin"
    );

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Navegación superior */}
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
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.875rem"
          }}
        >
          <Shield size={16} />
          Admin
        </Link>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <NavLink href="/admin" icon={<LayoutDashboard size={16} />}>Dashboard</NavLink>
          <NavLink href="/admin/users" icon={<Users size={16} />}>Usuarios</NavLink>
          <NavLink href="/admin/metrics" icon={<Activity size={16} />}>Métricas</NavLink>
          <NavLink href="/admin/audit" icon={<Shield size={16} />}>Auditoría</NavLink>
        </div>
      </div>

      {children}
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        background: "var(--surface-hover)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-secondary)",
        textDecoration: "none",
        fontSize: "0.875rem",
        transition: "all 0.2s ease"
      }}
    >
      {icon}
      {children}
    </Link>
  );
}
