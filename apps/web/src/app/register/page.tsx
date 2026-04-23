"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setError("Token de invitación requerido");
      setValidating(false);
      setLoading(false);
      return;
    }

    fetch(`/api/invitations/verify?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInvitation(data);
        } else {
          setError(data.error || "Invitación inválida");
        }
        setValidating(false);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al verificar invitación");
        setValidating(false);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Error al completar registro");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="skeleton" style={{ width: "50px", height: "50px", margin: "0 auto 1rem", borderRadius: "50%" }} />
            <p>Verificando invitación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2>Invitación inválida</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>{error}</p>
            <Link href="/login" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h2>¡Registro completado!</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Tu cuenta ha sido creada correctamente.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Completa tu registro</h2>
            <p className="login-subtitle">
              Has sido invitado como administrador de <strong>{invitation?.tenant?.name}</strong>
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={invitation?.email || ""}
                disabled
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="form-input"
                placeholder="Tu nombre"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="form-input"
                placeholder="Tus apellidos"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="form-input"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar contraseña *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="form-input"
                placeholder="Repite tu contraseña"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={submitting}
            >
              {submitting ? "Creando cuenta..." : "Completar registro"}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
