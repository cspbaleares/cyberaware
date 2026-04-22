import Link from "next/link";
import { redirect } from "next/navigation";
import { appConfig } from "../../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../../lib/server-session";

type PlatformTenant = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  enabledModules: string[];
};

async function fetchPlatformTenants(token: string): Promise<{
  tenants: PlatformTenant[];
  error?: string;
}> {
  const response = await fetch(`${appConfig.apiBaseUrl}/platform/tenants`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    redirect("/");
  }

  if (!response.ok) {
    return {
      tenants: [],
      error: "No se pudo cargar el listado de tenants en este momento.",
    };
  }

  return {
    tenants: (await response.json()) as PlatformTenant[],
  };
}

export default async function PlatformTenantsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.isSuperAdmin && !session.roles.includes("platform_admin")) {
    redirect("/");
  }

  const token = await getAccessTokenFromCookie();
  const { tenants, error } = await fetchPlatformTenants(token);

  return (
    <main className="app-shell">
      <section className="section">
        <div className="section-heading">
          <h1>Plataforma · Tenants</h1>
          <p>Listado global de tenants y módulos activos por tenant.</p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Módulos activos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.slug}</td>
                    <td>{tenant.isActive ? "Activo" : "Inactivo"}</td>
                    <td>
                      {tenant.enabledModules.length > 0
                        ? tenant.enabledModules.join(", ")
                        : "Sin módulos activos"}
                    </td>
                    <td>
                      <Link
                        className="button-secondary"
                        href={`/platform/tenants/${tenant.id}/modules`}
                      >
                        Gestionar módulos
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
