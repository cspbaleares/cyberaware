"use client";

import { useEffect, useState } from "react";
import { Activity, Server, Database, Users, Cpu, MemoryStick } from "lucide-react";

interface SystemMetrics {
  cpu: number;
  memory: number;
  activeUsers: number;
  requestsPerMinute: number;
  dbConnections: number;
  uptime: number;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    activeUsers: 0,
    requestsPerMinute: 0,
    dbConnections: 0,
    uptime: 0,
  });

  useEffect(() => {
    // Simular métricas - en producción vendrían de una API
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 30) + 10,
        memory: Math.floor(Math.random() * 40) + 30,
        activeUsers: Math.floor(Math.random() * 50) + 100,
        requestsPerMinute: Math.floor(Math.random() * 200) + 300,
        dbConnections: Math.floor(Math.random() * 10) + 5,
        uptime: Date.now(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp + 86400000) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem" }}>
        Métricas del Sistema
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
      }}>
        <MetricCard
          title="CPU Usage"
          value={`${metrics.cpu}%`}
          icon={<Cpu size={24} />}
          color="#06b6d4"
          trend={metrics.cpu > 70 ? "high" : "normal"}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memory}%`}
          icon={<MemoryStick size={24} />}
          color="#8b5cf6"
          trend={metrics.memory > 80 ? "high" : "normal"}
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.toString()}
          icon={<Users size={24} />}
          color="#22c55e"
          trend="normal"
        />
        <MetricCard
          title="Requests/min"
          value={metrics.requestsPerMinute.toString()}
          icon={<Activity size={24} />}
          color="#f97316"
          trend="normal"
        />
        <MetricCard
          title="DB Connections"
          value={metrics.dbConnections.toString()}
          icon={<Database size={24} />}
          color="#ec4899"
          trend="normal"
        />
        <MetricCard
          title="Uptime"
          value={formatUptime(metrics.uptime)}
          icon={<Server size={24} />}
          color="#10b981"
          trend="normal"
        />
      </div>

      {/* Gráfico de actividad */}
      <div className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
          Actividad en tiempo real
        </h3>
        <ActivityChart />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string;
  trend: "normal" | "high" | "critical";
}) {
  const trendColors = {
    normal: "#22c55e",
    high: "#f97316",
    critical: "#ef4444",
  };

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
            {title}
          </p>
          <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{value}</p>
        </div>
        <div style={{
          padding: "0.75rem",
          background: `${color}20`,
          borderRadius: "0.5rem",
          color: color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        marginTop: "1rem",
        height: "4px",
        background: "var(--muted)",
        borderRadius: "2px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: trend === "normal" ? "30%" : trend === "high" ? "70%" : "90%",
          background: trendColors[trend],
          borderRadius: "2px",
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

function ActivityChart() {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    // Generar datos de ejemplo
    const initialData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 50) + 25);
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => [...prev.slice(1), Math.floor(Math.random() * 50) + 25]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const max = Math.max(...data, 100);
  const points = data.map((value, i) => `${(i / (data.length - 1)) * 100},${100 - (value / max) * 100}`).join(" ");

  return (
    <div style={{ height: "200px", position: "relative" }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#activityGradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        color: "var(--muted-foreground)",
      }}>
        <span>-20s</span>
        <span>-10s</span>
        <span>Now</span>
      </div>
    </div>
  );
}
