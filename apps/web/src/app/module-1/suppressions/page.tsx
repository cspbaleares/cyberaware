import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/server-session";

type SuppressionItem = {
  id: string;
  tenantId: string;
  email: string;
  reason: string;
  scope: string;
  createdAt: string;
};

// Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const BlockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

function formatReason(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "bounce":
      return <span className="badge badge-amber"><AlertIcon /> Rebote</span>;
    case "complaint":
      return <span className="badge badge-red">Queja</span>;
    case "manual_optout":
      return <span className="badge badge-gray">Bloqueo manual</span>;
    default:
      return <span className="badge badge-gray">{value || "-"}</span>;
  }
}

function formatScope(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "all":
      return "Global";
    case "simulation":
      return "Solo simulaciones";
    default:
      return value || "-";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

type SuppressionResponse = {
  items: SuppressionItem[];
  page: number;
  pageSize: number;
  total: number;
};

async function fetchSuppressions(token: string): Promise<SuppressionResponse> {
  const response = await fetch(`${appConfig.apiBaseUrl}/mail-suppressions?page=1&pageSize=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  return (await response.json()) as SuppressionResponse;
}

export default async function SuppressionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("platform_access_token")?.value?.trim() || "";
  const session = await getCurrentSession();

  if (!token || !session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  let data: SuppressionResponse | null = null;
  let loadError = "";

  try {
    data = await fetchSuppressions(token);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  const bounceCount = data?.items.filter(i => i.reason === "bounce").length || 0;
  const complaintCount = data?.items.filter(i => i.reason === "complaint").length || 0;
  const manualCount = data?.items.filter(i => i.reason === "manual_optout").length || 0;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/module-1" className="breadcrumb-link">Simulación</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Supresiones</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <Link href="/module-1" className="btn btn-ghost btn-sm" style={{ marginBottom: "0.5rem" }}>
              <ArrowLeftIcon /> Volver a Simulación
            </Link>
            <h1 className="page-title">Supresiones</h1>
            <p className="page-description">
              Gestiona direcciones bloqueadas para proteger la reputación de tus envíos.
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

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total bloqueadas</div>
          <div className="stat-value">{data?.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rebotes</div>
          <div className="stat-value">{bounceCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quejas</div>
          <div className="stat-value">{complaintCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Manuales</div>
          <div className="stat-value">{manualCount}</div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
        <div className="card card-elevated">
          <div className="card-body" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div className="feature-icon" style={{ background: "linear-gradient(135deg, var(--warning-500), var(--error-500))" }}>
              <BlockIcon />
            </div>
            <div>
              <h3 className="feature-title">¿Qué son las supresiones?</h3>
              <p className="feature-description">
                Direcciones de email que han sido bloqueadas automáticamente por rebotes o quejas, 
                o manualmente por decisión del administrador.
              </p>
            </div>
          </div>
        </div>
        <div className="card card-elevated">
          <div className="card-body" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div className="feature-icon" style={{ background: "linear-gradient(135deg, var(--info-500), var(--accent-cyan))" }}>
              <AlertIcon />
            </div>
            <div>
              <h3 className="feature-title">¿Por qué importan?</h3>
              <p className="feature-description">
                Enviar a direcciones bloqueadas daña tu reputación como remitente. 
                El sistema las excluye automáticamente para proteger tus campañas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Direcciones bloqueadas</h2>
            <p className="section-description">Listado de emails excluidos del flujo de envío</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Motivo</th>
                <th>Alcance</th>
                <th>Fecha de bloqueo</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <MailIcon />
                      <h4 className="empty-state-title">No hay supresiones</h4>
                      <p className="empty-state-description">
                        No hay direcciones bloqueadas. Esto es positivo: indica que tus envíos 
                        están funcionando correctamente sin rebotes ni quejas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <MailIcon />
                        <strong style={{ color: "var(--text-primary)" }}>{item.email}</strong>
                      </div>
                    </td>
                    <td>{formatReason(item.reason)}</td>
                    <td>{formatScope(item.scope)}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
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
            <h2 className="section-title">Gestión de supresiones</h2>
            <p className="section-description">Recomendaciones para mantener listas limpias</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">Tip</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Revisa periódicamente
              </h4>
              <p className="feature-description">
                Si ves muchos rebotes, puede indicar problemas con la calidad de tu lista de destinatarios 
                o con la configuración de tus dominios.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-green">Buena práctica</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Respeta las quejas
              </h4>
              <p className="feature-description">
                Las quejas de usuarios deben tomarse en serio. Nunca intentes enviar a direcciones 
                que han reportado tus emails como spam.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
