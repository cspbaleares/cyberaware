import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/server-session";
import { assignTrainingFromPriorityAction } from "./actions";

// Icons
const GraduationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M22 10l-10-5L2 10l10 5 10-5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// Types
type TrainingCourse = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: string;
  estimatedMinutes?: number | null;
};

type EnrollmentMetrics = {
  total: number;
  assigned: number;
  inProgress: number;
  completed: number;
};

type CourseMetrics = {
  total: number;
  draft: number;
  published: number;
  archived: number;
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

function formatStatus(status: string) {
  switch (status.toLowerCase()) {
    case "published":
      return <span className="badge badge-green"><CheckIcon /> Publicado</span>;
    case "draft":
      return <span className="badge badge-gray">Borrador</span>;
    case "archived":
      return <span className="badge badge-red">Archivado</span>;
    default:
      return <span className="badge badge-gray">{status}</span>;
  }
}

export default async function Module3Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("platform_access_token")?.value?.trim() || "";
  const session = await getCurrentSession();

  if (!token || !session) redirect("/login");
  if (!session.enabledModules.includes("module_3")) redirect("/");

  let courses: TrainingCourse[] = [];
  let courseMetrics: CourseMetrics = { total: 0, draft: 0, published: 0, archived: 0 };
  let enrollmentMetrics: EnrollmentMetrics = { total: 0, assigned: 0, inProgress: 0, completed: 0 };
  let error = "";

  try {
    const [coursesRes, metricsRes, enrollmentsRes] = await Promise.all([
      fetchJson<{ items: TrainingCourse[] }>("/training-courses?page=1&pageSize=50", token),
      fetchJson<CourseMetrics>("/training-courses/metrics/summary", token),
      fetchJson<EnrollmentMetrics>("/training-enrollments/metrics/summary", token),
    ]);
    courses = coursesRes.items;
    courseMetrics = metricsRes;
    enrollmentMetrics = enrollmentsRes;
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  const publishedCourses = courses.filter(c => c.status === "published");
  const completionRate = enrollmentMetrics.total > 0 
    ? Math.round((enrollmentMetrics.completed / enrollmentMetrics.total) * 100) 
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Formación</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Formación</h1>
            <p className="page-description">
              Gestiona cursos de ciberseguridad y asignaciones de formación a usuarios.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/module-3/courses/new" className="btn btn-primary">
              <PlusIcon /> Nuevo curso
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
            <BookIcon /> Cursos totales
          </div>
          <div className="stat-value">{courseMetrics.total}</div>
          <div className="stat-change">{courseMetrics.published} publicados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UsersIcon /> Matriculaciones
          </div>
          <div className="stat-value">{enrollmentMetrics.total}</div>
          <div className="stat-change">{enrollmentMetrics.inProgress} en progreso</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckIcon /> Completados
          </div>
          <div className="stat-value">{enrollmentMetrics.completed}</div>
          <div className="stat-change positive">{completionRate}% tasa de finalización</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ClockIcon /> Pendientes
          </div>
          <div className="stat-value">{enrollmentMetrics.assigned}</div>
          <div className="stat-change">Por comenzar</div>
        </div>
      </div>

      {/* Progress Overview */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Progreso de formación</h2>
            <p className="section-description">Estado actual de las matriculaciones</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ flex: 1, height: "8px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ 
                  width: `${completionRate}%`, 
                  height: "100%", 
                  background: "linear-gradient(90deg, var(--success-500), var(--success-600))",
                  borderRadius: "var(--radius-full)"
                }} />
              </div>
              <div style={{ fontWeight: 600, color: "var(--success-500)" }}>{completionRate}%</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              <div style={{ textAlign: "center", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>{enrollmentMetrics.assigned}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Asignados</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--brand-400)" }}>{enrollmentMetrics.inProgress}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>En progreso</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--success-500)" }}>{enrollmentMetrics.completed}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Completados</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>{enrollmentMetrics.total}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Total</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Catálogo de cursos</h2>
            <p className="section-description">Cursos disponibles para asignación</p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Categoría</th>
                <th>Duración</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="empty-state">
                      <BookIcon />
                      <h4 className="empty-state-title">No hay cursos</h4>
                      <p className="empty-state-description">
                        Crea tu primer curso de formación en ciberseguridad.
                      </p>
                      <Link href="/module-3/courses/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                        <PlusIcon /> Nuevo curso
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <GraduationIcon />
                        <div>
                          <strong style={{ color: "var(--text-primary)" }}>{course.title}</strong>
                          {course.description && (
                            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
                              {course.description.substring(0, 60)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{course.category || "-"}</td>
                    <td>{course.estimatedMinutes ? `${course.estimatedMinutes} min` : "-"}</td>
                    <td>{formatStatus(course.status)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/module-3/courses/${course.id}`} className="btn btn-sm btn-secondary">
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* External Resources */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recursos externos</h2>
            <p className="section-description">Formación adicional de fuentes oficiales</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>INCIBE</h3>
            </div>
            <div className="card-body">
              <p className="feature-description" style={{ marginBottom: "1rem" }}>
                Instituto Nacional de Ciberseguridad - Recursos para ciudadanos y empresas.
              </p>
              <a 
                href="https://www.incibe.es/ciudadania/formacion" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <ExternalLinkIcon /> Ver recursos INCIBE
              </a>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>CCN-CERT</h3>
            </div>
            <div className="card-body">
              <p className="feature-description" style={{ marginBottom: "1rem" }}>
                Centro Criptológico Nacional - Formación especializada y guías STIC.
              </p>
              <a 
                href="https://www.ccn-cert.cni.es/formacion.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <ExternalLinkIcon /> Ver recursos CCN
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Mejores prácticas</h2>
            <p className="section-description">Consejos para una formación efectiva</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">Tip</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Asigna según el riesgo
              </h4>
              <p className="feature-description">
                Usa los datos del módulo de Riesgo Humano para asignar formación específica 
                a los usuarios que más la necesitan.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-green">Recomendado</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Varía el contenido
              </h4>
              <p className="feature-description">
                Ofrece diferentes tipos de formación: phishing, contraseñas, navegación segura, 
                dispositivos móviles, etc.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
