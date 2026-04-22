import Link from "next/link";
import { getCurrentSession, getAccessTokenFromCookie } from "@/lib/server-session";
import { appConfig } from "@/lib/config";
import AnalyticsDashboard from "@/components/analytics-dashboard";

// Icons as simple SVG components
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GraduationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 10l-10-5L2 10l10 5 10-5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// Fetch dashboard data
async function fetchDashboardData(token: string) {
  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/dashboard/tenant/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Landing Page Component
function LandingPage() {
  const features = [
    {
      icon: <ShieldIcon />,
      title: "Simulaciones de Phishing",
      description: "Campañas realistas para medir y mejorar la resiliencia de tu equipo ante ataques.",
    },
    {
      icon: <UsersIcon />,
      title: "Análisis de Riesgo Humano",
      description: "Identifica usuarios vulnerables y prioriza intervenciones basadas en datos.",
    },
    {
      icon: <GraduationIcon />,
      title: "Formación Personalizada",
      description: "Cursos adaptativos que se ajustan al nivel de riesgo de cada empleado.",
    },
    {
      icon: <ZapIcon />,
      title: "Automatización Inteligente",
      description: "Reglas automáticas que responden a eventos de seguridad en tiempo real.",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          {/* Logo grande */}
          <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
            <img 
              src="/logo.svg" 
              alt="CyberAware" 
              width="120" 
              height="120"
              style={{ 
                filter: "drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))",
                animation: "float 6s ease-in-out infinite"
              }}
            />
          </div>
          
          <div className="hero-eyebrow">
            <span style={{ color: "var(--success-500)" }}>●</span>
            Plataforma líder en Security Awareness
          </div>
          
          <h1 className="hero-title">
            Reduce el riesgo humano en tu organización
          </h1>
          
          <p className="hero-description">
            CyberAware combina simulaciones de phishing, análisis de riesgo y formación 
            personalizada para crear una cultura de seguridad sólida y medible.
          </p>
          
          <div className="hero-actions">
            <Link href="/login" className="btn btn-primary btn-lg">
              Comenzar ahora <ArrowRightIcon />
            </Link>
            <a href="mailto:comercial@cspbaleares.com?subject=Solicitud%20de%20demo%20-%20CyberAware&body=Hola,%0A%0AMe%20gustaría%20solicitar%20una%20demo%20de%20la%20plataforma%20CyberAware.%0A%0AGracias." className="btn btn-secondary btn-lg">
              Solicitar demo
            </a>
          </div>

          <div className="hero-trust">
            <p className="hero-trust-text">Confiado por equipos de seguridad en</p>
            <div className="hero-trust-logos">
              <span style={{ fontWeight: 600 }}>Tecnología</span>
              <span style={{ fontWeight: 600 }}>Sanidad</span>
              <span style={{ fontWeight: 600 }}>Finanzas</span>
              <span style={{ fontWeight: 600 }}>Educación</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-header">
          <h2 className="features-title">Todo lo que necesitas en una plataforma</h2>
          <p className="features-description">
            Cuatro módulos integrados que trabajan juntos para reducir el riesgo humano de forma continua.
          </p>
        </div>

        <div className="grid grid-2" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div className="feature-card" style={{ display: "flex", flexDirection: "column" }}>
            <img 
              src="/illustration-phishing.svg" 
              alt="Simulación de Phishing" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }}
            />
            <div className="feature-icon"><ShieldIcon /></div>
            <h3 className="feature-title">Simulaciones de Phishing</h3>
            <p className="feature-description">Campañas realistas para medir y mejorar la resiliencia de tu equipo ante ataques.</p>
          </div>
          
          <div className="feature-card" style={{ display: "flex", flexDirection: "column" }}>
            <img 
              src="/illustration-risk.svg" 
              alt="Análisis de Riesgo" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }}
            />
            <div className="feature-icon" style={{ background: "linear-gradient(135deg, var(--warning-500), var(--error-500))" }}>
              <UsersIcon />
            </div>
            <h3 className="feature-title">Análisis de Riesgo Humano</h3>
            <p className="feature-description">Identifica usuarios vulnerables y prioriza intervenciones basadas en datos.</p>
          </div>
          
          <div className="feature-card" style={{ display: "flex", flexDirection: "column" }}>
            <img 
              src="/illustration-training.svg" 
              alt="Formación" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }}
            />
            <div className="feature-icon" style={{ background: "linear-gradient(135deg, var(--success-500), var(--accent-cyan))" }}>
              <GraduationIcon />
            </div>
            <h3 className="feature-title">Formación Personalizada</h3>
            <p className="feature-description">Cursos adaptativos que se ajustan al nivel de riesgo de cada empleado.</p>
          </div>
          
          <div className="feature-card" style={{ display: "flex", flexDirection: "column" }}>
            <img 
              src="/illustration-automation.svg" 
              alt="Automatización" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }}
            />
            <div className="feature-icon" style={{ background: "linear-gradient(135deg, var(--warning-500), var(--error-500))" }}>
              <ZapIcon />
            </div>
            <h3 className="feature-title">Automatización Inteligente</h3>
            <p className="feature-description">Reglas automáticas que responden a eventos de seguridad en tiempo real.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-bg" />
        <div className="cta-content">
          <h2 className="cta-title">¿Listo para fortalecer tu seguridad?</h2>
          <p className="cta-description">
            Únete a las organizaciones que ya están reduciendo su riesgo humano con CyberAware.
          </p>
          <Link href="/login" className="btn btn-primary btn-lg">
            Acceder a la plataforma <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Dashboard Component
function Dashboard({ session, data }: { session: any; data: any }) {
  const enabled = new Set(session.enabledModules ?? []);
  
  const quickActions = [
    { label: "Nueva campaña", icon: "📧", href: "/module-1", enabled: enabled.has("module_1") },
    { label: "Ver riesgos", icon: "⚠️", href: "/module-2", enabled: enabled.has("module_2") },
    { label: "Asignar curso", icon: "📚", href: "/module-3", enabled: enabled.has("module_3") },
    { label: "Crear regla", icon: "⚡", href: "/module-4", enabled: enabled.has("module_4") },
  ].filter(a => a.enabled);

  const stats = data ? [
    { label: "Usuarios activos", value: data.users?.active ?? 0, change: "+12%" },
    { label: "Campañas este mes", value: data.campaigns?.active ?? 0, change: "+3" },
    { label: "Formación completada", value: data.trainingEnrollments?.completed ?? 0, change: "+8%" },
    { label: "Riesgo promedio", value: "Bajo", change: "-5%", positive: true },
  ] : [];

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <h1 className="dashboard-welcome-title">
          ¡Hola, {session.email.split("@")[0]}!
        </h1>
        <p className="dashboard-welcome-text">
          Bienvenido a <strong>{session.tenantSlug}</strong>. Aquí tienes un resumen de la actividad reciente.
        </p>
      </div>

      {/* Stats */}
      {data && (
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.positive ? "positive" : "positive"}`}>
                {stat.change} vs mes anterior
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Acciones rápidas</h2>
              <p className="section-description">Tareas comunes para gestionar tu seguridad</p>
            </div>
          </div>
          
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="quick-action">
                <div className="quick-action-icon">
                  <span style={{ fontSize: 24 }}>{action.icon}</span>
                </div>
                <span className="quick-action-label">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Analytics Dashboard */}
      <section className="section">
        <AnalyticsDashboard />
      </section>

      {/* Modules */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Módulos disponibles</h2>
            <p className="section-description">Accede a las herramientas de tu suite</p>
          </div>
        </div>

        <div className="grid grid-2">
          {enabled.has("module_1") && (
            <div className="card">
              <div className="card-body">
                <div className="feature-icon" style={{ marginBottom: "1rem" }}>
                  <ShieldIcon />
                </div>
                <h3 className="feature-title">Simulación de Phishing</h3>
                <p className="feature-description">
                  Crea campañas de phishing para medir la resiliencia de tu equipo.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <Link href="/module-1" className="btn btn-primary">
                    Abrir módulo <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {enabled.has("module_2") && (
            <div className="card">
              <div className="card-body">
                <div className="feature-icon" style={{ marginBottom: "1rem", background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}>
                  <UsersIcon />
                </div>
                <h3 className="feature-title">Análisis de Riesgo</h3>
                <p className="feature-description">
                  Identifica usuarios vulnerables y prioriza intervenciones.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <Link href="/module-2" className="btn btn-primary">
                    Abrir módulo <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {enabled.has("module_3") && (
            <div className="card">
              <div className="card-body">
                <div className="feature-icon" style={{ marginBottom: "1rem", background: "linear-gradient(135deg, var(--success-500), var(--accent-cyan))" }}>
                  <GraduationIcon />
                </div>
                <h3 className="feature-title">Formación</h3>
                <p className="feature-description">
                  Gestiona cursos y matriculaciones de formación en ciberseguridad.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <Link href="/module-3" className="btn btn-primary">
                    Abrir módulo <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {enabled.has("module_4") && (
            <div className="card">
              <div className="card-body">
                <div className="feature-icon" style={{ marginBottom: "1rem", background: "linear-gradient(135deg, var(--warning-500), var(--error-500))" }}>
                  <ZapIcon />
                </div>
                <h3 className="feature-title">Automatización</h3>
                <p className="feature-description">
                  Configura reglas automáticas para responder a eventos de seguridad.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <Link href="/module-4" className="btn btn-primary">
                    Abrir módulo <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Main Page Component
export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session) {
    return <LandingPage />;
  }

  const token = await getAccessTokenFromCookie();
  const dashboardData = token ? await fetchDashboardData(token) : null;

  return <Dashboard session={session} data={dashboardData} />;
}
