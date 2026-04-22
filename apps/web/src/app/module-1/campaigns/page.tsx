import Link from "next/link";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "@/lib/server-session";
import {
  archiveCampaignAction,
  assignRecipientsAction,
  dispatchCampaignAction,
  saveCampaignAction,
} from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const ArchiveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <polyline points="21,8 21,21 3,21 3,8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22,2 15,22 11,13 2,9" />
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

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// Types simplificados
type SimulationItem = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  scheduledAt?: string | null;
};

type SimulationSummary = {
  total: number;
  draft: number;
  scheduled: number;
  active: number;
  completed: number;
  archived: number;
};

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCampaignStatus(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return <span className="badge badge-gray">Borrador</span>;
    case "scheduled":
      return <span className="badge badge-blue">Programada</span>;
    case "active":
      return <span className="badge badge-green">Activa</span>;
    case "completed":
      return <span className="badge badge-green"><CheckIcon /> Completada</span>;
    case "archived":
      return <span className="badge badge-red">Archivada</span>;
    default:
      return <span className="badge badge-gray">{status || "-"}</span>;
  }
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function fetchCampaigns(token: string) {
  const response = await fetch(`${appConfig.apiBaseUrl}/phishing-simulations?page=1&pageSize=50`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/");
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as { items: SimulationItem[] };
}

async function fetchSummary(token: string) {
  const response = await fetch(`${appConfig.apiBaseUrl}/phishing-simulations/metrics/summary`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return { total: 0, draft: 0, scheduled: 0, active: 0, completed: 0, archived: 0 };
  return (await response.json()) as SimulationSummary;
}

export default async function CampaignsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.enabledModules.includes("module_1")) redirect("/");

  const resolvedSearchParams = await searchParams;
  const token = await getAccessTokenFromCookie();
  const saved = getValue(resolvedSearchParams.saved);
  const archived = getValue(resolvedSearchParams.archived);
  const error = getValue(resolvedSearchParams.error);

  let campaigns: SimulationItem[] = [];
  let summary: SimulationSummary = { total: 0, draft: 0, scheduled: 0, active: 0, completed: 0, archived: 0 };
  let loadError = "";

  try {
    const [campaignsResult, summaryResult] = await Promise.all([
      fetchCampaigns(token),
      fetchSummary(token),
    ]);
    campaigns = campaignsResult.items;
    summary = summaryResult;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/module-1" className="breadcrumb-link">Simulación</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Campañas</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <Link href="/module-1" className="btn btn-ghost btn-sm" style={{ marginBottom: "0.5rem" }}>
              <ArrowLeftIcon /> Volver a Simulación
            </Link>
            <h1 className="page-title">Campañas</h1>
            <p className="page-description">
              Crea y gestiona campañas de simulación de phishing para tu organización.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/module-1/campaigns/new" className="btn btn-primary">
              <PlusIcon /> Nueva campaña
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {saved && (
        <div className="badge badge-green" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckIcon /> Campaña guardada correctamente
        </div>
      )}
      {archived && (
        <div className="badge badge-amber" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArchiveIcon /> Campaña archivada
        </div>
      )}
      {error && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
          {decodeURIComponent(error)}
        </div>
      )}
      {loadError && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total campañas</div>
          <div className="stat-value">{summary.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activas / Programadas</div>
          <div className="stat-value">{summary.active + summary.scheduled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completadas</div>
          <div className="stat-value">{summary.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Borradores</div>
          <div className="stat-value">{summary.draft}</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Campañas</h2>
            <p className="section-description">Gestiona tus campañas de simulación</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Programada</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <SendIcon />
                      <h4 className="empty-state-title">No hay campañas</h4>
                      <p className="empty-state-description">
                        Crea tu primera campaña para comenzar a simular ataques de phishing.
                      </p>
                      <Link href="/module-1/campaigns/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                        <PlusIcon /> Nueva campaña
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <SendIcon />
                        <strong style={{ color: "var(--text-primary)" }}>{item.name}</strong>
                      </div>
                      {item.description && (
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td>{formatCampaignStatus(item.status)}</td>
                    <td>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("es-ES") : "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Link href={`/module-1/campaigns/${item.id}`} className="btn btn-sm btn-secondary">
                          Ver detalles
                        </Link>
                        <form action={archiveCampaignAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="btn btn-sm btn-ghost">
                            Archivar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Guía rápida</h2>
            <p className="section-description">Pasos para crear una campaña efectiva</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">1</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Crea la campaña
              </h4>
              <p className="feature-description">
                Define el nombre, selecciona una plantilla y elige el dominio de envío.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">2</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Asigna destinatarios
              </h4>
              <p className="feature-description">
                Selecciona los usuarios que recibirán la simulación.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">3</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Lanza la campaña
              </h4>
              <p className="feature-description">
                Envía los emails y comienza a recibir métricas en tiempo real.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">4</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Analiza resultados
              </h4>
              <p className="feature-description">
                Revisa tasas de apertura, clics y usuarios que reportaron el email.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
