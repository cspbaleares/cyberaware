"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  enabledModules: string[];
}

interface Invitation {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  tenant?: { name: string };
}

export default function PlatformTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("tenant_admin");
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tenantsRes, invitationsRes] = await Promise.all([
        fetch("/api/platform/tenants"),
        fetch("/api/invitations"),
      ]);

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData.tenants || []);
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (err) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !inviteEmail) return;

    setSending(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          tenantId: selectedTenant.id,
          role: inviteRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(`Invitación enviada a ${inviteEmail}`);
        setInviteEmail("");
        setShowModal(false);
        fetchData(); // Refresh invitations list
      } else {
        setError(data.error || "Error al enviar invitación");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSending(false);
    }
  };

  const openInviteModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setInviteEmail("");
    setInviteRole("tenant_admin");
    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };

  if (loading) {
    return (
      <main className="app-shell">
        <section className="section">
          <div className="section-heading">
            <h1>Plataforma · Tenants</h1>
            <p>Cargando...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="section">
        <div className="section-heading">
          <h1>Plataforma · Tenants</h1>
          <p>Gestión de tenants y administradores.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        {successMessage && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{successMessage}</div>}

        {/* Tenants Table */}
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Tenants</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Módulos activos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td><strong>{tenant.name}</strong></td>
                    <td>{tenant.slug}</td>
                    <td>
                      <span className={`badge ${tenant.isActive ? "badge-green" : "badge-red"}`}>
                        {tenant.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      {tenant.enabledModules.length > 0
                        ? tenant.enabledModules.join(", ")
                        : "Sin módulos"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link
                          className="btn btn-sm btn-secondary"
                          href={`/platform/tenants/${tenant.id}/modules`}
                        >
                          Módulos
                        </Link>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openInviteModal(tenant)}
                        >
                          Invitar admin
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="panel">
            <h2 style={{ marginBottom: "1rem" }}>Invitaciones pendientes</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Tenant</th>
                    <th>Rol</th>
                    <th>Expira</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.email}</td>
                      <td>{inv.tenant?.name || "-"}</td>
                      <td>{inv.role}</td>
                      <td>{new Date(inv.expiresAt).toLocaleDateString("es-ES")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Invite Modal */}
      {showModal && selectedTenant && (
        <div 
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-xl)",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
              border: "1px solid var(--border-default)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "0.5rem" }}>Invitar administrador</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Tenant: <strong>{selectedTenant.name}</strong>
            </p>

            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email del administrador *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="admin@empresa.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="form-select"
                >
                  <option value="tenant_admin">Administrador de Tenant</option>
                  <option value="user">Usuario</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending || !inviteEmail}
                  style={{ flex: 1 }}
                >
                  {sending ? "Enviando..." : "Enviar invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
