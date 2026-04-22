"use client";

import { TrendingUp, TrendingDown, Mail, MousePointer, ShieldAlert, GraduationCap } from "lucide-react";

export default function AnalyticsDashboard() {
  const mockData = {
    emailsSent: 1400,
    clickRate: 17,
    highRiskUsers: 12,
    trainingCompleted: 82,
  };

  return (
    <div style={{ padding: "1.5rem 0" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Dashboard de Analytics
      </h2>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
        Resumen de métricas y estadísticas de seguridad
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <MetricCard title="Emails Enviados" value={mockData.emailsSent} change="+12%" icon={<Mail size={20} />} positive />
        <MetricCard title="Tasa de Clics" value={`${mockData.clickRate}%`} change="-3%" icon={<MousePointer size={20} />} negative />
        <MetricCard title="Usuarios en Riesgo" value={mockData.highRiskUsers} change="5 críticos" icon={<ShieldAlert size={20} />} negative />
        <MetricCard title="Formación Completada" value={`${mockData.trainingCompleted}%`} change="+8%" icon={<GraduationCap size={20} />} positive />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
      }}>
        <SimpleBarChart title="Actividad de Phishing" data={[120, 150, 180, 200, 220, 250, 280]} />
        <SimpleLineChart title="Tendencia de Riesgo" data={[45, 52, 48, 61, 55, 58, 62]} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon, positive = false, negative = false }: { 
  title: string; 
  value: string | number; 
  change: string;
  icon: React.ReactNode;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>{title}</p>
        <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{value}</p>
        <p style={{ 
          fontSize: "0.875rem", 
          color: positive ? "#22c55e" : negative ? "#ef4444" : "var(--muted-foreground)",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          marginTop: "0.25rem"
        }}>
          {positive && <TrendingUp size={14} />}
          {negative && <TrendingDown size={14} />}
          {change}
        </p>
      </div>
      <div style={{ padding: "0.75rem", background: "var(--muted)", borderRadius: "0.5rem", color: "var(--cyan-400)" }}>
        {icon}
      </div>
    </div>
  );
}

function SimpleBarChart({ title, data }: { title: string; data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>{title}</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "150px" }}>
        {data.map((value, i) => (
          <div key={i} style={{ flex: 1, height: `${(value / max) * 100}%`, background: "linear-gradient(to top, #06b6d4, #3b82f6)", borderRadius: "0.25rem 0.25rem 0 0", minHeight: "4px" }} title={`Valor: ${value}`} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
        <span>Lun</span>
        <span>Dom</span>
      </div>
    </div>
  );
}

function SimpleLineChart({ title, data }: { title: string; data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>{title}</h3>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "150px" }} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
        <span>Lun</span>
        <span>Dom</span>
      </div>
    </div>
  );
}
