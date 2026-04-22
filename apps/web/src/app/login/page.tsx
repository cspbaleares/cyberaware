import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const tenantSlug = getValue(params.tenantSlug) || "";
  const email = getValue(params.email) || "";
  const step = getValue(params.step);
  const error = getValue(params.error);

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="login-logo-text">CyberAware</div>
          <div className="login-logo-tagline">Human Risk Intelligence Platform</div>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">
              {step === "mfa" ? "Verificación en dos pasos" : "Bienvenido de nuevo"}
            </h1>
            <p className="login-subtitle">
              {step === "mfa"
                ? "Introduce el código de verificación para continuar"
                : "Introduce tus credenciales para acceder a tu cuenta"}
            </p>
          </div>

          {error && (
            <div className="badge badge-red" style={{ marginBottom: "1rem", justifyContent: "center" }}>
              {decodeURIComponent(error)}
            </div>
          )}

          {step !== "mfa" ? (
            <form method="POST" action="/login/start">
              <div className="form-group">
                <label className="form-label" htmlFor="tenantSlug">
                  Organización
                </label>
                <input
                  id="tenantSlug"
                  name="tenantSlug"
                  type="text"
                  className="form-input"
                  placeholder="tu-organizacion"
                  defaultValue={tenantSlug}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="tu@empresa.com"
                  defaultValue={email}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Iniciar sesión
              </button>
            </form>
          ) : (
            <form method="POST" action="/login/verify">
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="email" value={email} />

              <div className="form-group">
                <label className="form-label" htmlFor="code">
                  Código de verificación
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  className="form-input"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="form-hint">
                  Introduce el código de 6 dígitos de tu aplicación de autenticación
                </p>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Verificar
              </button>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            ¿Problemas para acceder? Contacta con el administrador de tu organización
          </p>
        </div>
      </div>
    </div>
  );
}
