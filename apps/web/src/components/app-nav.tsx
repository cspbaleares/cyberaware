import Link from "next/link";
import { getCurrentSession } from "../lib/server-session";

const moduleMeta = {
  module_1: { href: "/module-1", label: "Simulación" },
  module_2: { href: "/module-2", label: "Riesgo humano" },
  module_3: { href: "/module-3", label: "Formación" },
  module_4: { href: "/module-4", label: "Automatización" },
} as const;

export async function AppNav() {
  const session = await getCurrentSession();
  const enabled = (session?.enabledModules ?? []).filter(
    (module): module is keyof typeof moduleMeta => module in moduleMeta,
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-cluster">
          <Link href="/" className="brand" aria-label="CyberAware Suite · Inicio">
            <span className="brand-mark" />
            <div>
              <strong>CyberAware Suite</strong>
              <p>
                {session
                  ? `${session.tenantSlug} · ${session.email}`
                  : "Human Risk Intelligence Platform"}
              </p>
            </div>
          </Link>

          {session ? (
            <div className="tenant-chip" aria-label="Tenant activo">
              <span className="tenant-chip__label">Tenant</span>
              <strong>{session.tenantSlug}</strong>
            </div>
          ) : null}
        </div>

        <div className="topbar-right">
          <nav className="nav-links" aria-label="Principal">
            <Link href="/">Inicio</Link>

            {!session ? (
              <Link href="/login">Acceso</Link>
            ) : (
              <>
                {(session.isSuperAdmin || session.roles.includes("platform_admin")) ? (
                  <Link href="/platform/tenants">Plataforma</Link>
                ) : null}

                {enabled.map((module) => (
                  <Link key={module} href={moduleMeta[module].href}>
                    {moduleMeta[module].label}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {session ? (
            <form method="POST" action="/logout" className="topbar-session-actions">
              <button type="submit" className="button-secondary">
                Cerrar sesión
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
