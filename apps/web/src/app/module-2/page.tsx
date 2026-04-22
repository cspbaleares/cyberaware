import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/server-session";
import { recalculateTenantRiskAction, recalculateUserRiskAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <polyline points="23,4 23,10 17,10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// Types
type RiskSummary = { total: number; low: number; medium: number; high: number; averageScore: number };
type RiskItem = {
  userId: string;
  score: number;
  level: "low" | "medium" | "high";
  calculatedAt: string;
  user: { id: string; fullName: string; email: string; isActive: boolean };
};

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatRiskLevel(level: string) {
  switch (level) {
    case "low": return <span className="badge badge-green">Bajo</span>;
    case "medium": return <span className="badge badge-amber">Medio</span>;
    case "high": return <span className="badge badge-red"><AlertTriangleIcon /> Alto</span>;
    default: return <span className="badge badge-gray">{level}</span>;
  }
}

function getPriorityLabel(score: number) {
  if (score >= 67) return <span className="badge badge-red">Crítica</span>;
  if (score >= 34) return <span className="badge badge-amber">Activa</span>;
  return <span className="badge badge-green">Ligera</span>;
}

async function fetchJson<T>(path: string, token: string) {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as T;
}

export default async function Module2Page({ searchParams }: { searchParams: SearchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("platform_access_token")?.value?.trim() || "";
  const session = await getCurrentSession();
  const params = await searchParams;
  const recalculated = getValue(params.recalculated);
  const recalculatedUser = getValue(params.recalculatedUser);
  const errorFromParams = getValue(params.error);

  if (!token || !session) redirect("/login");
  if (!session.enabledModules.includes("module_2")) redirect("/");

  let riskSummary: RiskSummary | null = null;
  let riskItems: RiskItem[] = [];
  let error = errorFromParams || "";

  try {
    const [summary, items] = await Promise.all([
      fetchJson<RiskSummary>("/risk-scoring/tenant/summary", token),
      fetchJson<{ items: RiskItem[] }>("/risk-scoring/tenant", token),
    ]);
    riskSummary = summary;
    riskItems = items.items ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  const highRisk = riskItems.filter((item) => item.level === "high");
  const mediumRisk = riskItems.filter((item) => item.level === "medium");
  const lowRisk = riskItems.filter((item) => item.level === "low");

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Riesgo Humano</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Riesgo Humano</h1>
            <p className="page-description">
              Identifica usuarios vulnerables y prioriza intervenciones basadas en datos.
            </p>
          </div>
          <div className="page-actions">
            <form action={recalculateTenantRiskAction}>
              <button type="submit" className="btn btn-secondary">
                <RefreshIcon /> Recalcular
              </button>
            </form>
            <Link href="/module-4" className="btn btn-primary">
              <ZapIcon /> Automatización
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {recalculated && (
        <div className="badge badge-green" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <RefreshIcon /> Recálculo completado: {recalculated} usuarios procesados
        </div>
      )}
      {recalculatedUser && (
        <div className="badge badge-green" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <RefreshIcon /> Usuario recalculado correctamente
        </div>
      )}
      {error && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
          {error}
        </div>
      )}

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UsersIcon /> Usuarios evaluados
          </div>
          <div className="stat-value">{riskSummary?.total ?? 0}</div>
          <div className="stat-change">Cobertura completa del tenant</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangleIcon /> Riesgo alto
          </div>
          <div className="stat-value" style={{ color: "var(--error-500)" }}>{riskSummary?.high ?? 0}</div>
          <div className="stat-change">Requieren intervención prioritaria</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldIcon /> Riesgo medio
          </div>
          <div className="stat-value" style={{ color: "var(--warning-500)" }}>{riskSummary?.medium ?? 0}</div>
          <div className="stat-change">Seguimiento activo recomendado</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUpIcon /> Puntuación media
          </div>
          <div className="stat-value">{riskSummary?.averageScore ?? 0}</div>
          <div className="stat-change">Exposición global del tenant</div>
        </div>
      </div>

      {/* Risk Distribution */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Distribución del riesgo</h2>
            <p className="section-description">Visualización de la concentración de riesgo en el tenant</p>
          </div>
        </div>

        <div className="grid grid-3">
          <div className="card" style={{ borderLeft: "4px solid var(--error-500)" }}>
            <div className="card-body">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <AlertTriangleIcon />
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Riesgo Alto</h3>
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--error-500)" }}>
                {highRisk.length}
              </div>
              <p className="feature-description" style={{ marginTop: "0.5rem" }}>
                Usuarios que requieren intervención inmediata y seguimiento cercano.
              </p>
            </div>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--warning-500)" }}>
            <div className="card-body">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <ShieldIcon />
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Riesgo Medio</h3>
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--warning-500)" }}>
                {mediumRisk.length}
              </div>
              <p className="feature-description" style={{ marginTop: "0.5rem" }}>
                Usuarios que necesitan refuerzo preventivo y revisión periódica.
              </p>
            </div>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--success-500)" }}>
            <div className="card-body">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <UsersIcon />
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Riesgo Bajo</h3>
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--success-500)" }}>
                {lowRisk.length}
              </div>
              <p className="feature-description" style={{ marginTop: "0.5rem" }}>
                Usuarios con seguimiento normal y observación estándar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* High Risk Users */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Usuarios de alto riesgo</h2>
            <p className="section-description">Prioridad de intervención inmediata</p>
          </div>
        </div>

        {highRisk.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: "3rem" }}>
              <ShieldIcon />
              <h4 className="empty-state-title">No hay usuarios de alto riesgo</h4>
              <p className="empty-state-description">
                Excelente noticia. Tu organización no tiene usuarios en el nivel de riesgo más alto.
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Puntuación</th>
                  <th>Nivel</th>
                  <th>Prioridad</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.slice(0, 10).map((item) => (
                  <tr key={item.userId}>
                    <td>
                      <strong style={{ color: "var(--text-primary)" }}>{item.user?.fullName || "-"}</strong>
                    </td>
                    <td>{item.user?.email || "-"}</td>
                    <td style={{ fontWeight: 600 }}>{item.score}</td>
                    <td>{formatRiskLevel(item.level)}</td>
                    <td>{getPriorityLabel(item.score)}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={recalculateUserRiskAction} style={{ display: "inline" }}>
                        <input type="hidden" name="userId" value={item.userId} />
                        <button type="submit" className="btn btn-sm btn-secondary">
                          <RefreshIcon /> Recalcular
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {highRisk.length > 10 && (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                Y {highRisk.length - 10} usuarios más...
              </div>
            )}
          </div>
        )}
      </section>

      {/* All Users Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Todos los usuarios evaluados</h2>
            <p className="section-description">Listado completo con puntuaciones de riesgo</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Puntuación</th>
                <th>Nivel</th>
                <th>Prioridad</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {riskItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <UsersIcon />
                      <h4 className="empty-state-title">Sin evaluaciones</h4>
                      <p className="empty-state-description">
                        No hay datos de riesgo disponibles. Ejecuta un recálculo para comenzar.
                      </p>
                      <form action={recalculateTenantRiskAction}>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                          <RefreshIcon /> Recalcular ahora
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ) : (
                riskItems.map((item) => (
                  <tr key={item.userId}>
                    <td>{item.user?.fullName || "-"}</td>
                    <td>{item.user?.email || "-"}</td>
                    <td style={{ fontWeight: 600 }}>{item.score}</td>
                    <td>{formatRiskLevel(item.level)}</td>
                    <td>{getPriorityLabel(item.score)}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={recalculateUserRiskAction} style={{ display: "inline" }}>
                        <input type="hidden" name="userId" value={item.userId} />
                        <button type="submit" className="btn btn-sm btn-ghost">
                          Recalcular
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Análisis y recomendaciones</h2>
            <p className="section-description">Interpretación de los datos y próximos pasos sugeridos</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUpIcon /> Lectura del tenant
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Estado general</div>
                  <div style={{ fontWeight: 600, marginTop: "0.25rem" }}>
                    {riskSummary && riskSummary.high > 0 
                      ? "⚠️ Requiere atención: hay usuarios en riesgo alto" 
                      : "✅ Controlado: sin usuarios en riesgo crítico"}
                  </div>
                </div>
                <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Concentración del riesgo</div>
                  <div style={{ fontWeight: 600, marginTop: "0.25rem" }}>
                    {riskSummary && riskSummary.medium > riskSummary.high 
                      ? "Mayoría en riesgo medio: oportunidad de refuerzo preventivo" 
                      : "Distribución variada: revisar casos individuales"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ZapIcon /> Acciones recomendadas
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {riskSummary && riskSummary.high > 0 && (
                  <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-lg)", borderLeft: "3px solid var(--error-500)" }}>
                    <div style={{ fontWeight: 600, color: "var(--error-500)" }}>Intervención inmediata</div>
                    <div style={{ fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>
                      Los {riskSummary.high} usuarios de riesgo alto deberían recibir formación específica lo antes posible.
                    </div>
                  </div>
                )}
                {riskSummary && riskSummary.medium > 0 && (
                  <div style={{ padding: "0.75rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "var(--radius-lg)", borderLeft: "3px solid var(--warning-500)" }}>
                    <div style={{ fontWeight: 600, color: "var(--warning-500)" }}>Refuerzo preventivo</div>
                    <div style={{ fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>
                      Considera campañas de concienciación para los {riskSummary.medium} usuarios de riesgo medio.
                    </div>
                  </div>
                )}
                <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontWeight: 600 }}>Conexión con formación</div>
                  <div style={{ fontSize: "var(--text-sm)", marginTop: "0.25rem" }}>
                    Los usuarios identificados pueden ser asignados automáticamente a cursos específicos desde el módulo de Formación.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
