import Link from "next/link";
import { redirect } from "next/navigation";
import { appConfig } from "../../../../../lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "../../../../../lib/server-session";
import { updateTenantModuleAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type TenantModulesResponse = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  modules: Array<{
    id: string;
    moduleKey: string;
    isEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function fetchTenantModules(
  tenantId: string,
  token: string,
): Promise<{ data: TenantModulesResponse | null; error?: string }> {
  const response = await fetch(
    `${appConfig.apiBaseUrl}/platform/tenants/${tenantId}/modules`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    redirect("/");
  }

  if (response.status === 404) {
    return {
      data: null,
      error: "El tenant solicitado no existe o ya no está disponible.",
    };
  }

  if (!response.ok) {
    return {
      data: null,
      error: "No se pudieron cargar los módulos del tenant en este momento.",
    };
  }

  return {
    data: (await response.json()) as TenantModulesResponse,
  };
}

export default async function PlatformTenantModulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: SearchParams;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.isSuperAdmin && !session.roles.includes("platform_admin")) {
    redirect("/");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = await getAccessTokenFromCookie();
  const { data, error: loadError } = await fetchTenantModules(resolvedParams.tenantId, token);
  const error = getValue(resolvedSearchParams.error) || loadError || "";
  const saved = getValue(resolvedSearchParams.saved);

  if (!data) {
    return (
      <main className="app-shell">
        <section className="section">
          <div className="section-heading">
            <h1>Plataforma · Módulos por tenant</h1>
            <p>No se pudo cargar el tenant solicitado.</p>
          </div>

          <div className="actions">
            <Link className="button-secondary" href="/platform/tenants">
              Volver a tenants
            </Link>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="section">
        <div className="section-heading">
          <h1>Plataforma · Módulos por tenant</h1>
          <p>
            {data.tenant.name} · {data.tenant.slug}
          </p>
        </div>

        <div className="actions">
          <Link className="button-secondary" href="/platform/tenants">
            Volver a tenants
          </Link>
        </div>

        {saved ? <div className="panel note-panel"><p>Cambio guardado correctamente.</p></div> : null}
        {error ? <div className="error-box">{decodeURIComponent(error)}</div> : null}

        <div className="module-grid module-grid--2">
          {data.modules.map((module) => {
            const nextEnabled = !module.isEnabled;

            return (
              <article className="module-card" key={module.id}>
                <h3>{module.moduleKey}</h3>
                <p>
                  Estado actual: <strong>{module.isEnabled ? "Activo" : "Inactivo"}</strong>
                </p>
                <p>
                  Última actualización:{" "}
                  {module.updatedAt
                    ? new Date(module.updatedAt).toLocaleString("es-ES")
                    : "Sin cambios registrados"}
                </p>

                <form action={updateTenantModuleAction} className="card-actions">
                  <input type="hidden" name="tenantId" value={data.tenant.id} />
                  <input type="hidden" name="moduleKey" value={module.moduleKey} />
                  <input
                    type="hidden"
                    name="isEnabled"
                    value={nextEnabled ? "true" : "false"}
                  />
                  <button type="submit" className={nextEnabled ? "button-primary" : "button-secondary"}>
                    {nextEnabled ? "Activar" : "Desactivar"}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
