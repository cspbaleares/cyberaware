import Link from "next/link";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getAccessTokenFromCookie, getCurrentSession } from "@/lib/server-session";
import { archiveTemplateAction, saveTemplateAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type TemplateItem = {
  id: string;
  name: string;
  subject: string;
  senderName?: string | null;
  senderEmail?: string | null;
  landingUrl?: string | null;
  htmlBody: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatTemplateStatus(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return <span className="badge badge-gray">Borrador</span>;
    case "published":
      return <span className="badge badge-green"><CheckIcon /> Publicada</span>;
    case "archived":
      return <span className="badge badge-red">Archivada</span>;
    default:
      return <span className="badge badge-gray">{status || "-"}</span>;
  }
}

async function fetchTemplates(token: string) {
  const response = await fetch(`${appConfig.apiBaseUrl}/phishing-templates?page=1&pageSize=50`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/");
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as { items: TemplateItem[] };
}

export default async function TemplatesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.enabledModules.includes("module_1")) redirect("/");

  const resolvedSearchParams = await searchParams;
  const token = await getAccessTokenFromCookie();
  const saved = getValue(resolvedSearchParams.saved);
  const archived = getValue(resolvedSearchParams.archived);
  const error = getValue(resolvedSearchParams.error);
  const editId = getValue(resolvedSearchParams.edit);

  let templates: TemplateItem[] = [];
  let loadError = "";

  try {
    const result = await fetchTemplates(token);
    templates = result.items;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  const selected = templates.find((item) => item.id === editId) ?? null;
  const previewHtml = selected?.htmlBody ?? "";
  const publishedCount = templates.filter(t => t.status === "published").length;
  const draftCount = templates.filter(t => t.status === "draft").length;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/module-1" className="breadcrumb-link">Simulación</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Plantillas</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <Link href="/module-1" className="btn btn-ghost btn-sm" style={{ marginBottom: "0.5rem" }}>
              <ArrowLeftIcon /> Volver a Simulación
            </Link>
            <h1 className="page-title">Plantillas</h1>
            <p className="page-description">
              Crea y gestiona plantillas de emails para tus campañas de simulación.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/module-1/templates" className="btn btn-primary">
              <PlusIcon /> Nueva plantilla
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {saved && (
        <div className="badge badge-green" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckIcon /> Plantilla guardada correctamente
        </div>
      )}
      {archived && (
        <div className="badge badge-amber" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArchiveIcon /> Plantilla archivada
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
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total plantillas</div>
          <div className="stat-value">{templates.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Publicadas</div>
          <div className="stat-value">{publishedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Borradores</div>
          <div className="stat-value">{draftCount}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
              {selected ? "Editar plantilla" : "Crear plantilla"}
            </h3>
          </div>
          <div className="card-body">
            <form action={saveTemplateAction}>
              <input type="hidden" name="id" value={selected?.id ?? ""} />

              <div className="form-group">
                <label className="form-label form-label-required">Nombre</label>
                <input
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Nombre descriptivo"
                  defaultValue={selected?.name ?? ""}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Asunto</label>
                <input
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Asunto del email"
                  defaultValue={selected?.subject ?? ""}
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Nombre del remitente</label>
                  <input
                    name="senderName"
                    type="text"
                    className="form-input"
                    placeholder="Ej: Soporte Técnico"
                    defaultValue={selected?.senderName ?? ""}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo del remitente</label>
                  <input
                    name="senderEmail"
                    type="email"
                    className="form-input"
                    placeholder="noreply@ejemplo.com"
                    defaultValue={selected?.senderEmail ?? ""}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">URL de destino</label>
                <input
                  name="landingUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  defaultValue={selected?.landingUrl ?? ""}
                />
                <p className="form-hint">Página a la que llegarán los usuarios al hacer clic</p>
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select name="status" className="form-select" defaultValue={selected?.status ?? "draft"}>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicada</option>
                  <option value="archived">Archivada</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Contenido HTML</label>
                <textarea
                  name="htmlBody"
                  className="form-textarea"
                  rows={12}
                  placeholder="<html>...</html>"
                  defaultValue={selected?.htmlBody ?? ""}
                  required
                />
                <p className="form-hint">Código HTML del email. Usa estilos inline para mejor compatibilidad.</p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" className="btn btn-primary">
                  {selected ? "Guardar cambios" : "Crear plantilla"}
                </button>
                {selected && (
                  <Link href="/module-1/templates" className="btn btn-secondary">
                    Nueva plantilla
                  </Link>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Preview */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
              <EyeIcon /> Vista previa
            </h3>
          </div>
          <div className="card-body">
            {!selected ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <div className="empty-state-icon">
                  <FileTextIcon />
                </div>
                <h4 className="empty-state-title">Selecciona una plantilla</h4>
                <p className="empty-state-description">
                  Selecciona una plantilla de la tabla para ver su vista previa.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "0.25rem" }}>De:</div>
                  <div style={{ fontWeight: 500 }}>{selected.senderName || "Sin nombre"} &lt;{selected.senderEmail || "sin@email.com"}&gt;</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "0.5rem", marginBottom: "0.25rem" }}>Asunto:</div>
                  <div style={{ fontWeight: 500 }}>{selected.subject}</div>
                </div>
                <iframe
                  title="preview-template"
                  sandbox=""
                  style={{ width: "100%", minHeight: 400, border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", background: "#fff" }}
                  srcDoc={previewHtml}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Biblioteca de plantillas</h2>
            <p className="section-description">Gestiona tus plantillas de email</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Asunto</th>
                <th>Estado</th>
                <th>Remitente</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <FileTextIcon />
                      <h4 className="empty-state-title">No hay plantillas</h4>
                      <p className="empty-state-description">
                        Crea tu primera plantilla para comenzar a enviar simulaciones.
                      </p>
                      <Link href="/module-1/templates" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                        <PlusIcon /> Nueva plantilla
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                templates.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileTextIcon />
                        <strong style={{ color: "var(--text-primary)" }}>{item.name}</strong>
                      </div>
                    </td>
                    <td>{item.subject}</td>
                    <td>{formatTemplateStatus(item.status)}</td>
                    <td>{item.senderEmail || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Link href={`/module-1/templates?edit=${item.id}`} className="btn btn-sm btn-secondary">
                          Ver / editar
                        </Link>
                        <form action={archiveTemplateAction} style={{ display: "inline" }}>
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

      {/* Tips */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Consejos para plantillas efectivas</h2>
            <p className="section-description">Mejores prácticas para tus emails de simulación</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">Tip</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Usa remitentes creíbles
              </h4>
              <p className="feature-description">
                Elige nombres y correos que sean coherentes con el escenario de ataque que simulas.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-green">Recomendado</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Varía los escenarios
              </h4>
              <p className="feature-description">
                Crea plantillas con diferentes pretextos: actualizaciones, facturas, notificaciones de seguridad...
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
