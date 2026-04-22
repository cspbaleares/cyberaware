import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/server-session";

// Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22,2 15,22 11,13 2,9" />
  </svg>
);

const BlockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Types
type TenantSummary = {
  users: { total: number; active: number; inactive: number };
  campaigns: { total: number; draft: number; scheduled: number; active: number; completed: number; archived: number };
  campaignAssignments: { total: number; assigned: number; inProgress: number; completed: number };
  trainingCourses: { total: number; draft: number; published: number; archived: number };
  trainingEnrollments: { total: number; assigned: number; inProgress: number; completed: number };
  yearToDate: { year: number; campaigns: number; campaignsCompleted: number; campaignAssignments: number; trainingCourses: number; trainingEnrollments: number; suppressions: number };
};

type RiskSummary = { total: number; low: number; medium: number; high: number; averageScore: number };
type SuppressionSummary = { total: number; bounce: number; complaint: number; manualOptout: number };

async function fetchJson<T>(path: string, token: string) {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as T;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("platform_access_token")?.value?.trim() || "";
  const session = await getCurrentSession();

  if (!token || !session) redirect("/login");
  if (!session.enabledModules.includes("module_1")) redirect("/");

  let tenantSummary: TenantSummary | null = null;
  let riskSummary: RiskSummary | null = null;
  let suppressionSummary: SuppressionSummary | null = null;
  let loadError = "";

  try {
    const [tenant, risk, suppressions] = await Promise.all([
      fetchJson<TenantSummary>("/dashboard/tenant/summary", token),
      fetchJson<RiskSummary>("/risk-scoring/tenant/summary", token),
      fetchJson<SuppressionSummary>("/mail-suppressions/metrics/summary", token),
    ]);
    tenantSummary = tenant;
    riskSummary = risk;
    suppressionSummary = suppressions;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  const currentYear = tenantSummary?.yearToDate.year ?? new Date().getFullYear();

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/module-1" className="breadcrumb-link">Simulación</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Panel</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <Link href="/module-1" className="btn btn-ghost btn-sm" style={{ marginBottom: "0.5rem" }}>
              <ArrowLeftIcon /> Volver a Simulación
            </Link>
            <h1 className="page-title">Panel de Control</h1>
            <p className="page-description">
              Visión ejecutiva del módulo de simulación: métricas, actividad y estado general.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {loadError && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
          {loadError}
        </div>
      )}

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UsersIcon /> Usuarios
          </div>
          <div className="stat-value">{tenantSummary?.users.total ?? 0}</div>
          <div className="stat-change">
            {tenantSummary?.users.active ?? 0} activos · {tenantSummary?.users.inactive ?? 0} inactivos
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <SendIcon /> Campañas
          </div>
          <div className="stat-value">{tenantSummary?.campaigns.total ?? 0}</div>
          <div className="stat-change">
            {tenantSummary?.campaigns.active ?? 0} activas · {tenantSummary?.campaigns.scheduled ?? 0} programadas
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BlockIcon /> Bloqueos
          </div>
          <div className="stat-value">{suppressionSummary?.total ?? 0}</div>
          <div className="stat-change">
            {suppressionSummary?.bounce ?? 0} rebotes · {suppressionSummary?.complaint ?? 0} quejas
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangleIcon /> Riesgo medio
          </div>
          <div className="stat-value">{riskSummary?.averageScore ?? 0}</div>
          <div className="stat-change">
            {riskSummary?.low ?? 0} bajo · {riskSummary?.medium ?? 0} medio · {riskSummary?.high ?? 0} alto
          </div>
        </div>
      </div>

      {/* Year Stats */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarIcon /> Actividad {currentYear}
            </h2>
            <p className="section-description">Resumen anual de la actividad del módulo</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Campañas</div>
            <div className="stat-value">{tenantSummary?.yearToDate.campaigns ?? 0}</div>
            <div className="stat-change positive">
              {tenantSummary?.yearToDate.campaignsCompleted ?? 0} completadas
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Asignaciones</div>
            <div className="stat-value">{tenantSummary?.yearToDate.campaignAssignments ?? 0}</div>
            <div className="stat-change">Carga operativa del año</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Formación</div>
            <div className="stat-value">{tenantSummary?.yearToDate.trainingEnrollments ?? 0}</div>
            <div className="stat-change">
              {tenantSummary?.yearToDate.trainingCourses ?? 0} cursos creados
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bloqueos</div>
            <div className="stat-value">{tenantSummary?.yearToDate.suppressions ?? 0}</div>
            <div className="stat-change">Incidencias acumuladas</div>
          </div>
        </div>
      </section>

      {/* Detail Cards */}
      <div className="grid grid-2">
        {/* Campaign Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUpIcon /> Actividad de Campañas
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Programadas / Activas</div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                  {(tenantSummary?.campaigns.scheduled ?? 0) + (tenantSummary?.campaigns.active ?? 0)}
                </div>
              </div>
              <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Completadas / Archivadas</div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                  {(tenantSummary?.campaigns.completed ?? 0) + (tenantSummary?.campaigns.archived ?? 0)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                <span>Borradores</span>
                <strong>{tenantSummary?.campaigns.draft ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                <span>Programadas</span>
                <strong>{tenantSummary?.campaigns.scheduled ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                <span>Activas</span>
                <strong>{tenantSummary?.campaigns.active ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                <span>Completadas</span>
                <strong>{tenantSummary?.campaigns.completed ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UsersIcon /> Asignaciones y Formación
            </h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Asignaciones de campañas
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1, textAlign: "center", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{tenantSummary?.campaignAssignments.total ?? 0}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Total</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{tenantSummary?.campaignAssignments.inProgress ?? 0}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>En progreso</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{tenantSummary?.campaignAssignments.completed ?? 0}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Completadas</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Matrículas de formación
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1, textAlign: "center", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{tenantSummary?.trainingEnrollments.total ?? 0}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Total</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{tenantSummary?.trainingEnrollments.inProgress ?? 0}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>En progreso</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{tenantSummary?.trainingEnrollments.completed ?? 0}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Completadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Training & Health */}
      <section className="section">
        <div className="grid grid-2">
          {/* Training Catalog */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
                Catálogo de Formación
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Total de cursos</span>
                <span style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>{tenantSummary?.trainingCourses.total ?? 0}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <span>Borradores</span>
                  <span className="badge badge-gray">{tenantSummary?.trainingCourses.draft ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <span>Publicados</span>
                  <span className="badge badge-green">{tenantSummary?.trainingCourses.published ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <span>Archivados</span>
                  <span className="badge badge-red">{tenantSummary?.trainingCourses.archived ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
                Salud del Tenant
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--success-500)" }}>
                    {tenantSummary?.users.active ?? 0}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Usuarios activos</div>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--error-500)" }}>
                    {suppressionSummary?.total ?? 0}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Bloqueos</div>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--warning-500)" }}>
                    {riskSummary?.high ?? 0}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Riesgo alto</div>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--brand-400)" }}>
                    {tenantSummary?.campaigns.active ?? 0}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Campañas activas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
