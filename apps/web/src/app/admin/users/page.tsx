"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Mail, Shield, User, Trash2, Edit, RefreshCw, CheckCircle, AlertCircle, X } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt?: string;
  roles: string[];
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("users");
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, invitationsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/invitations"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (invitationsRes.ok) {
        const invData = await invitationsRes.json();
        setInvitations(invData.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `✅ Invitación enviada a ${inviteEmail}. El usuario recibirá un email para completar el registro.` });
        setInviteEmail("");
        setShowInviteModal(false);
        fetchData();
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: "error", text: data.error || "Error al enviar invitación" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "❌ Error de conexión. Inténtalo de nuevo." });
    } finally {
      setSending(false);
    }
  };

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling user:", error);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting invitation:", error);
    }
  };

  if (loading) {
    return (
      <div className="app-main">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <RefreshCw size={32} className="animate-spin" />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main">
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Users size={32} />
              Gestión de Usuarios
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              Administra los usuarios de tu organización y envía invitaciones
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowInviteModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Plus size={18} />
            Invitar usuario
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div 
            className={`alert alert-${message.type}`}
            style={{ 
              marginBottom: "1rem",
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
              background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === "success" ? "var(--success-500)" : "var(--error-500)"}`,
              color: message.type === "success" ? "var(--success-500)" : "var(--error-500)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-default)" }}>
          <button
            className={`btn btn-ghost ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
            style={{ 
              borderBottom: activeTab === "users" ? "2px solid var(--brand-500)" : "none",
              borderRadius: 0,
            }}
          >
            Usuarios ({users.length})
          </button>
          <button
            className={`btn btn-ghost ${activeTab === "invitations" ? "active" : ""}`}
            onClick={() => setActiveTab("invitations")}
            style={{ 
              borderBottom: activeTab === "invitations" ? "2px solid var(--brand-500)" : "none",
              borderRadius: 0,
            }}
          >
            Invitaciones pendientes ({invitations.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Último acceso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="user-avatar" style={{ width: "36px", height: "36px" }}>
                            {user.fullName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </div>
                          <span>{user.fullName || "-"}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.isSuperAdmin ? (
                          <span className="badge badge-purple">Super Admin</span>
                        ) : (
                          <span className="badge badge-blue">{user.roles.join(", ")}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? "badge-green" : "badge-red"}`}>
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString("es-ES")
                          : "Nunca"
                        }
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button 
                            className="btn btn-sm btn-secondary"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className={`btn btn-sm ${user.isActive ? "btn-danger" : "btn-success"}`}
                            onClick={() => handleToggleUser(user.id, user.isActive)}
                            title={user.isActive ? "Desactivar" : "Activar"}
                          >
                            {user.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === "invitations" && (
          <div className="card">
            {invitations.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Mail size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                <p>No hay invitaciones pendientes</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Enviada</th>
                      <th>Expira</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.email}</td>
                        <td>
                          <span className="badge badge-blue">{inv.role}</span>
                        </td>
                        <td>{new Date(inv.createdAt).toLocaleDateString("es-ES")}</td>
                        <td>{new Date(inv.expiresAt).toLocaleDateString("es-ES")}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteInvitation(inv.id)}
                            title="Cancelar invitación"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
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
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="card"
            style={{ maxWidth: "500px", width: "100%", padding: "2rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Mail size={24} />
              Invitar usuario
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Envía una invitación por email para unirse a tu organización
            </p>

            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="form-select"
                >
                  <option value="user">Usuario</option>
                  <option value="analyst">Analista</option>
                  <option value="tenant_admin">Administrador</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInviteModal(false)}
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
    </div>
  );
}
