import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/server-session";

// Icons
const TemplateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const DomainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const CampaignIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const BlockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default async function Module1Page() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.enabledModules.includes("module_1")) {
    redirect("/");
  }

  const workflowItems = [
    {
      icon: <TemplateIcon />,
      title: "Plantillas",
      description: "Crea y gestiona plantillas de emails de phishing para tus campañas.",
      href: "/module-1/templates",
      status: "active",
    },
    {
      icon: <DomainIcon />,
      title: "Dominios",
      description: "Configura y verifica dominios para el envío de simulaciones.",
      href: "/module-1/domains",
      status: "active",
    },
    {
      icon: <CampaignIcon />,
      title: "Campañas",
      description: "Lanza campañas, gestiona destinatarios y mide resultados.",
      href: "/module-1/campaigns",
      status: "active",
    },
    {
      icon: <BlockIcon />,
      title: "Supresiones",
      description: "Gestiona direcciones bloqueadas y evita envíos no deseados.",
      href: "/module-1/suppressions",
      status: "active",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Simulación de Phishing</h1>
            <p className="page-description">
              Crea campañas realistas para medir y mejorar la resiliencia de tu equipo ante ataques.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/module-1/campaigns/new" className="btn btn-primary">
              Nueva campaña <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Campañas activas</div>
          <div className="stat-value">3</div>
          <div className="stat-change positive">+1 esta semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tasa de clic</div>
          <div className="stat-value">12%</div>
          <div className="stat-change positive">-3% vs mes anterior</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Plantillas</div>
          <div className="stat-value">8</div>
          <div className="stat-change">Disponibles</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dominios verificados</div>
          <div className="stat-value">2</div>
          <div className="stat-change">Listos para envío</div>
        </div>
      </div>

      {/* Workflow */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Flujo de trabajo</h2>
            <p className="section-description">Gestiona todo el ciclo de vida de tus campañas de simulación</p>
          </div>
        </div>

        <div className="grid grid-2">
          {workflowItems.map((item, index) => (
            <Link key={index} href={item.href} className="card card-hover">
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div className="feature-icon" style={{ flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="feature-title">{item.title}</h3>
                    <p className="feature-description">{item.description}</p>
                    <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-400)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
                      Acceder <ArrowRightIcon />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Dashboard Link */}
      <section className="section">
        <div className="card card-elevated">
          <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className="feature-icon">
                <DashboardIcon />
              </div>
              <div>
                <h3 className="feature-title">Panel de control</h3>
                <p className="feature-description">Visualiza métricas, actividad y rendimiento del módulo</p>
              </div>
            </div>
            <Link href="/module-1/dashboard" className="btn btn-secondary">
              Ver panel <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Consejos rápidos</h2>
            <p className="section-description">Mejores prácticas para tus campañas de simulación</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-blue">Tip</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Varía el contenido de tus campañas
              </h4>
              <p className="feature-description">
                Usa diferentes plantillas y escenarios para mantener a tu equipo alerta ante diversos tipos de ataques.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="badge badge-green">Recomendado</span>
              </div>
              <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Programa campañas regulares
              </h4>
              <p className="feature-description">
                La consistencia es clave. Programa campañas mensuales para mantener la concienciación.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
