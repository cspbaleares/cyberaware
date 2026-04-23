"use client";

import { useState, useEffect } from "react";
import { Shield, Search, Filter, Calendar, User, RefreshCw } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  tenantId?: string;
  tenantName?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userEmail?.toLowerCase().includes(filter.toLowerCase()) ||
      log.action?.toLowerCase().includes(filter.toLowerCase()) ||
      log.details?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const actionTypes = ["all", "user.created", "user.updated", "user.deleted", "invitation.sent", "login", "logout"];

  if (loading) {
    return (
      <div className="app-main">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <RefreshCw size={32} className="animate-spin" />
          <p>Cargando logs de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main">
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Shield size={32} />
            Logs de Auditoría
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Registro de todas las acciones realizadas en la plataforma
          </p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
              <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar por usuario, acción o detalles..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "40px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={18} />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">Todas las acciones</option>
                {actionTypes.filter(a => a !== "all").map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-secondary" onClick={fetchLogs}>
              <RefreshCw size={18} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <StatCard title="Total de logs" value={logs.length} color="#06b6d4" />
          <StatCard title="Hoy" value={logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length} color="#22c55e" />
          <StatCard title="Esta semana" value={logs.filter(l => {
            const logDate = new Date(l.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return logDate >= weekAgo;
          }).length} color="#8b5cf6" />
        </div>

        {/* Logs Table */}
        <div className="card">
          {filteredLogs.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Shield size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
              <p>No se encontraron logs</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Detalles</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Calendar size={14} />
                          {new Date(log.createdAt).toLocaleString("es-ES")}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <User size={14} />
                          {log.userEmail}
                          {log.tenantName && (
                            <span className="badge badge-gray" style={{ fontSize: "0.75rem" }}>
                              {log.tenantName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.details}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "var(--radius-lg)",
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: color,
      }}>
        <Shield size={24} />
      </div>
      <div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{title}</p>
        <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

function getActionColor(action: string): string {
  if (action.includes("created")) return "badge-green";
  if (action.includes("updated")) return "badge-blue";
  if (action.includes("deleted")) return "badge-red";
  if (action.includes("login")) return "badge-purple";
  return "badge-gray";
}
