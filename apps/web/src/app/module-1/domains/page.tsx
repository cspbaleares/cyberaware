import Link from "next/link";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "@/lib/server-session";
import { archiveDomainAction, saveDomainAction, verifyDomainAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type DomainItem = {
  id: string;
  domain: string;
  type: string;
  provider?: string | null;
  status: string;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  spfExpected?: string | null;
  dkimExpected?: string | null;
  dmarcExpected?: string | null;
  bounceExpected?: string | null;
  trackingExpected?: string | null;
  spfStatus?: string;
  dkimStatus?: string;
  dmarcStatus?: string;
  bounceStatus?: string;
  trackingStatus?: string;
};

type DomainListResponse = {
  items: DomainItem[];
  page: number;
  pageSize: number;
  total: number;
};

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

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9,12 12,15 16,10" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDomainType(type?: string | null) {
  switch ((type || "").toLowerCase()) {
    case "simulation_sender":
      return "Envío de simulaciones";
    case "tracking":
      return "Seguimiento";
    case "bounce":
      return "Rebotes";
    default:
      return type || "-";
  }
}

function getStatusBadge(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "verified":
      return <span className="badge badge-green"><CheckIcon /> Verificado</span>;
    case "pending":
      return <span className="badge badge-amber"><AlertIcon /> Pendiente</span>;
    case "draft":
      return <span className="badge badge-gray">Borrador</span>;
    case "archived":
      return <span className="badge badge-red">Archivado</span>;
    default:
      return <span className="badge badge-gray">{status || "-"}</span>;
  }
}

async function fetchDomains(token: string): Promise<DomainListResponse> {
  const response = await fetch(`${appConfig.apiBaseUrl}/mail-domains?page=1&pageSize=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/");

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  return (await response.json()) as DomainListResponse;
}

export default async function DomainsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getCurrentSession();

  if (!session) redirect("/login");
  if (!session.enabledModules.includes("module_1")) redirect("/");

  const resolvedSearchParams = await searchParams;
  const token = await getAccessTokenFromCookie();
  const saved = getValue(resolvedSearchParams.saved);
  const verified = getValue(resolvedSearchParams.verified);
  const archived = getValue(resolvedSearchParams.archived);
  const error = getValue(resolvedSearchParams.error);
  const editId = getValue(resolvedSearchParams.edit);

  let domains: DomainItem[] = [];
  let loadError = "";

  try {
    const result = await fetchDomains(token);
    domains = result.items;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  const selected = domains.find((item) => item.id === editId) ?? null;
  const activeDomains = domains.filter(d => d.status !== "archived");
  const verifiedDomains = domains.filter(d => d.status === "verified");

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/module-1" className="breadcrumb-link">Simulación</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Dominios</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <Link href="/module-1" className="btn btn-ghost btn-sm" style={{ marginBottom: "0.5rem" }}>
              <ArrowLeftIcon /> Volver a Simulación
            </Link>
            <h1 className="page-title">Dominios</h1>
            <p className="page-description">
              Configura y verifica dominios para el envío de simulaciones de phishing.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/module-1/domains" className="btn btn-primary">
              <PlusIcon /> Nuevo dominio
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {saved && (
        <div className="badge badge-green" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}>
          <CheckIcon /> Dominio guardado correctamente
        </div>
      )}
      {verified && (
        <div className="badge badge-green" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}>
          <CheckIcon /> Dominio verificado correctamente
        </div>
      )}
      {archived && (
        <div className="badge badge-amber" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}>
          <ArchiveIcon /> Dominio archivado
        </div>
      )}
      {error && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}>
          {decodeURIComponent(error)}
        </div>
      )}
      {loadError && (
        <div className="badge badge-red" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total dominios</div>
          <div className="stat-value">{domains.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activos</div>
          <div className="stat-value">{activeDomains.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verificados</div>
          <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {verifiedDomains.length}
            {verifiedDomains.length > 0 && <ShieldCheckIcon />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
              {selected ? "Editar dominio" : "Registrar nuevo dominio"}
            </h3>
          </div>
          <div className="card-body">
            <form action={saveDomainAction}>
              <input type="hidden" name="id" value={selected?.id ?? ""} />

              <div className="form-group">
                <label className="form-label form-label-required">Dominio</label>
                <input
                  name="domain"
                  type="text"
                  className="form-input"
                  placeholder="ejemplo.com"
                  defaultValue={selected?.domain ?? ""}
                  required
                  disabled={Boolean(selected)}
                />
                <p className="form-hint">El dominio que usarás para enviar simulaciones</p>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select
                  name="type"
                  className="form-select"
                  defaultValue={selected?.type ?? "simulation_sender"}
                  disabled={Boolean(selected)}
                >
                  <option value="simulation_sender">Envío de simulaciones</option>
                  <option value="tracking">Seguimiento</option>
                  <option value="bounce">Rebotes</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <input
                  name="provider"
                  type="text"
                  className="form-input"
                  placeholder="mailgun"
                  defaultValue={selected?.provider ?? "mailgun"}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo del remitente</label>
                <input
                  name="fromEmail"
                  type="email"
                  className="form-input"
                  placeholder="noreply@ejemplo.com"
                  defaultValue={selected?.fromEmail ?? ""}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del remitente</label>
                <input
                  name="fromName"
                  type="text"
                  className="form-input"
                  placeholder="CyberAware"
                  defaultValue={selected?.fromName ?? ""}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Responder a</label>
                <input
                  name="replyTo"
                  type="email"
                  className="form-input"
                  placeholder="soporte@ejemplo.com"
                  defaultValue={selected?.replyTo ?? ""}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" className="btn btn-primary">
                  {selected ? "Guardar cambios" : "Registrar dominio"}
                </button>
                {selected && (
                  <Link href="/module-1/domains" className="btn btn-secondary">
                    Nuevo dominio
                  </Link>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* DNS Records */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
              Registros DNS requeridos
            </h3>
          </div>
          <div className="card-body">
            {!selected ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <div className="empty-state-icon">
                  <GlobeIcon />
                </div>
                <h4 className="empty-state-title">Selecciona un dominio</h4>
                <p className="empty-state-description">
                  Selecciona un dominio de la tabla para ver los registros DNS necesarios para su verificación.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SPF</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    readOnly
                    value={selected.spfExpected || "No configurado"}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">DKIM</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    readOnly
                    value={selected.dkimExpected || "No configurado"}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">DMARC</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    readOnly
                    value={selected.dmarcExpected || "No configurado"}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Rebotes</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    readOnly
                    value={selected.bounceExpected || "No configurado"}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Dominios configurados</h2>
            <p className="section-description">Gestiona tus dominios y su estado de verificación</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dominio</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Proveedor</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <GlobeIcon />
                      <h4 className="empty-state-title">No hay dominios</h4>
                      <p className="empty-state-description">
                        Registra tu primer dominio para comenzar a enviar simulaciones.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                domains.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <GlobeIcon />
                        <strong style={{ color: "var(--text-primary)" }}>{item.domain}</strong>
                      </div>
                    </td>
                    <td>{formatDomainType(item.type)}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>{item.provider || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Link
                          href={`/module-1/domains?edit=${item.id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          Ver
                        </Link>
                        <form action={verifyDomainAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="btn btn-sm btn-secondary">
                            Verificar
                          </button>
                        </form>
                        <form action={archiveDomainAction} style={{ display: "inline" }}>
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
    </div>
  );
}
