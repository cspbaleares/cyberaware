import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/server-session";
import { createAutomationRuleAction, resolveInterventionAction, toggleAutomationRuleAction } from "./actions";

// Icons
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Types
type AutomationRule = {
  id: string;
  title: string;
  description?: string | null;
  triggerType: string;
  actionType: string;
  priority: "high" | "medium" | "low";
  targetTrainingId?: string | null;
  targetModuleKey?: string | null;
  cooldownMinutes: number;
  isEnabled: boolean;
};

type AutomationMetrics = {
  total: number;
  enabled: number;
  disabled: number;
  interventions?: { open: number; resolved?: number; averageResolutionMinutes?: number };
};

type InterventionItem = {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  openedAt: string;
  resolvedAt?: string | null;
  user: { id: string; fullName: string; email: string };
};

const triggerLabels: Record<string, string> = {
  risk_score_changed: "Cambio en Riesgo Humano",
  risk_high_detected: "Riesgo alto detectado",
  simulation_repeated_failure: "Simulación repetida",
  training_stalled: "Formación estancada",
};

const actionLabels: Record<string, string> = {
  assign_training: "Asignar formación",
  flag_follow_up: "Crear seguimiento",
  create_intervention: "Crear intervención",
  recommend_external_resource: "Recomendar recurso externo",
};

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/");
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as T;
}

function formatPriority(priority: string) {
  switch (priority) {
    case "high": return <span className="badge badge-red"><AlertIcon /> Alta</span>;
    case "medium": return <span className="badge badge-amber">Media</span>;
    default: return <span className="badge badge-gray">Base</span>;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default async function Module4Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("platform_access_token")?.value?.trim() || "";
  const session = await getCurrentSession();

  if (!token || !session) redirect("/login");
  if (!session.enabledModules.includes("module_4")) redirect("/");

  let rules: AutomationRule[] = [];
  let metrics: AutomationMetrics | null = null;
  let interventions: InterventionItem[] = [];
  let error = "";

  try {
    const [rulesResult, metricsResult, interventionsResult] = await Promise.all([
      fetchJson<{ items: AutomationRule[] }>("/automation/rules", token),
      fetchJson<AutomationMetrics>("/automation/rules/metrics/summary", token),
      fetchJson<{ items: InterventionItem[] }>("/automation/interventions?status=open", token),
    ]);
    rules = rulesResult.items ?? [];
    metrics = metricsResult;
    interventions = interventionsResult.items ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  const activeRules = rules.filter(r => r.isEnabled);
  const pausedRules = rules.filter(r => !r.isEnabled);

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Automatización</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Automatización</h1>
            <p className="page-description">
              Convierte señales de riesgo en acciones automáticas de formación e intervención.
            </p>
          </div>
          <div className="page-actions">
            <Link href="#new-rule" className="btn btn-primary">
              <PlusIcon /> Nueva regla
            </Link>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
          {error}
        </div>
      )}

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <SettingsIcon /> Reglas totales
          </div>
          <div className="stat-value">{metrics?.total ?? rules.length}</div>
          <div className="stat-change">{activeRules.length} activas · {pausedRules.length} pausadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PlayIcon /> Reglas activas
          </div>
          <div className="stat-value" style={{ color: "var(--success-500)" }}>{metrics?.enabled ?? activeRules.length}</div>
          <div className="stat-change positive">Ejecutando automáticamente</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertIcon /> Intervenciones abiertas
          </div>
          <div className="stat-value" style={{ color: "var(--warning-500)" }}>{metrics?.interventions?.open ?? interventions.length}</div>
          <div className="stat-change">Pendientes de resolución</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ClockIcon /> Tiempo medio
          </div>
          <div className="stat-value">{metrics?.interventions?.averageResolutionMinutes ?? 0}m</div>
          <div className="stat-change">Resolución de intervenciones</div>
        </div>
      </div>

      {/* New Rule Form */}
      <section className="section" id="new-rule">
        <div className="section-header">
          <div>
            <h2 className="section-title">Crear nueva regla</h2>
            <p className="section-description">Define automatizaciones basadas en eventos del sistema</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <form action={createAutomationRuleAction}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label form-label-required">Título</label>
                  <input name="title" type="text" className="form-input" placeholder="Ej: Formación para riesgo alto" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input name="description" type="text" className="form-input" placeholder="Breve descripción de la regla" />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label form-label-required">Disparador</label>
                  <select name="triggerType" className="form-select" required>
                    <option value="risk_high_detected">Riesgo alto detectado</option>
                    <option value="risk_score_changed">Cambio en Riesgo Humano</option>
                    <option value="simulation_repeated_failure">Simulación repetida</option>
                    <option value="training_stalled">Formación estancada</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Acción</label>
                  <select name="actionType" className="form-select" required>
                    <option value="assign_training">Asignar formación</option>
                    <option value="create_intervention">Crear intervención</option>
                    <option value="flag_follow_up">Crear seguimiento</option>
                    <option value="recommend_external_resource">Recomendar recurso externo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label form-label-required">Prioridad</label>
                  <select name="priority" className="form-select" required>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Base</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cooldown (minutos)</label>
                  <input name="cooldownMinutes" type="number" className="form-input" min={5} max={10080} defaultValue={120} />
                  <p className="form-hint">Tiempo mínimo entre ejecuciones de la misma regla</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary">
                  <PlusIcon /> Crear regla
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Rules Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Reglas configuradas</h2>
            <p className="section-description">Gestiona tus automatizaciones activas y pausadas</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Regla</th>
                <th>Prioridad</th>
                <th>Disparador</th>
                <th>Acción</th>
                <th>Cooldown</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Control</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <SettingsIcon />
                      <h4 className="empty-state-title">No hay reglas</h4>
                      <p className="empty-state-description">
                        Crea tu primera regla de automatización para empezar a automatizar respuestas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <strong style={{ color: "var(--text-primary)" }}>{rule.title}</strong>
                      {rule.description && (
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                          {rule.description}
                        </p>
                      )}
                    </td>
                    <td>{formatPriority(rule.priority)}</td>
                    <td>{triggerLabels[rule.triggerType] || rule.triggerType}</td>
                    <td>{actionLabels[rule.actionType] || rule.actionType}</td>
                    <td>{rule.cooldownMinutes} min</td>
                    <td>
                      {rule.isEnabled ? (
                        <span className="badge badge-green"><PlayIcon /> Activa</span>
                      ) : (
                        <span className="badge badge-gray"><PauseIcon /> Pausada</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <form action={toggleAutomationRuleAction} style={{ display: "inline" }}>
                        <input type="hidden" name="ruleId" value={rule.id} />
                        <input type="hidden" name="isEnabled" value={rule.isEnabled ? "false" : "true"} />
                        <button type="submit" className="btn btn-sm btn-secondary">
                          {rule.isEnabled ? "Pausar" : "Activar"}
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

      {/* Interventions */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Intervenciones abiertas</h2>
            <p className="section-description">Bandeja de intervenciones generadas por las reglas</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Usuario</th>
                <th>Prioridad</th>
                <th>Fecha</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {interventions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <CheckIcon />
                      <h4 className="empty-state-title">Sin intervenciones</h4>
                      <p className="empty-state-description">
                        No hay intervenciones pendientes. Las reglas están funcionando correctamente.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                interventions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: "var(--text-primary)" }}>{item.title}</strong>
                      {item.description && (
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td>{item.user?.fullName || item.user?.email || "-"}</td>
                    <td>{formatPriority(item.priority)}</td>
                    <td>{formatDateTime(item.openedAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={resolveInterventionAction} style={{ display: "inline" }}>
                        <input type="hidden" name="interventionId" value={item.id} />
                        <button type="submit" className="btn btn-sm btn-primary">
                          <CheckIcon /> Resolver
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

      {/* Tips */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Mejores prácticas</h2>
            <p className="section-description">Consejos para una automatización efectiva</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">Tip</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Usa cooldowns apropiados
              </h4>
              <p className="feature-description">
                Configura tiempos de espera razonables entre ejecuciones para evitar saturar a los usuarios 
                con múltiples acciones simultáneas.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-green">Recomendado</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Prioriza según el riesgo
              </h4>
              <p className="feature-description">
                Asigna prioridad alta a reglas que responden a riesgo alto, y prioridad base a seguimientos 
                rutinarios.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
