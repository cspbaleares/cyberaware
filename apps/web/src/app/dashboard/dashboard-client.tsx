"use client";

import { useEffect, useMemo, useState } from "react";
import { appConfig } from "../../lib/config";

type TenantSummary = Record<string, unknown>;
type RiskSummary = Record<string, unknown>;
type SuppressionSummary = {
  total?: number;
  bounce?: number;
  complaint?: number;
  manualOptout?: number;
};

const STORAGE_KEY = "platform.accessToken";

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${text}`);
  }

  return JSON.parse(text) as T;
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function DashboardClient() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [suppressionSummary, setSuppressionSummary] = useState<SuppressionSummary | null>(null);

  const hasData = useMemo(
    () => tenantSummary || riskSummary || suppressionSummary,
    [tenantSummary, riskSummary, suppressionSummary],
  );

  async function loadData(nextToken?: string) {
    const effectiveToken = (nextToken ?? token).trim();

    if (!effectiveToken) {
      setError("Falta Bearer token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [tenant, risk, suppressions] = await Promise.all([
        fetchJson<TenantSummary>("/dashboard/tenant/summary", effectiveToken),
        fetchJson<RiskSummary>("/risk-scoring/tenant/summary", effectiveToken),
        fetchJson<SuppressionSummary>("/mail-suppressions/metrics/summary", effectiveToken),
      ]);

      setTenantSummary(tenant);
      setRiskSummary(risk);
      setSuppressionSummary(suppressions);
      window.localStorage.setItem(STORAGE_KEY, effectiveToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setTenantSummary(null);
      setRiskSummary(null);
      setSuppressionSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem(STORAGE_KEY)?.trim() || "";
    if (!savedToken) return;
    setToken(savedToken);
    void loadData(savedToken);
  }, []);

  function clearToken() {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setTenantSummary(null);
    setRiskSummary(null);
    setSuppressionSummary(null);
    setError("");
  }

  return (
    <main className="app-shell">
      <section className="section">
        <div className="section-heading">
          <h1>Dashboard tenant</h1>
          <p>Carga manual usando token Bearer del backend ya validado.</p>
        </div>

        <div className="panel form-panel">
          <label className="field">
            <span>Bearer token</span>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pega aquí el access token obtenido por login + MFA"
              rows={6}
            />
          </label>

          <div className="actions">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Cargar dashboard"}
            </button>

            <button
              type="button"
              onClick={clearToken}
              className="button-secondary"
            >
              Limpiar token
            </button>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="meta-label">Suppressions</span>
          <strong className="stat-value">{suppressionSummary?.total ?? "-"}</strong>
          <p className="stat-detail">
            Bounce: {suppressionSummary?.bounce ?? "-"} · Complaint:{" "}
            {suppressionSummary?.complaint ?? "-"} · Manual:{" "}
            {suppressionSummary?.manualOptout ?? "-"}
          </p>
        </article>
      </section>

      <section className="section">
        <div className="module-grid module-grid--2">
          <article className="module-card">
            <h3>Dashboard tenant summary</h3>
            <pre className="json-box">
              {tenantSummary ? pretty(tenantSummary) : "Sin datos cargados"}
            </pre>
          </article>

          <article className="module-card">
            <h3>Risk scoring tenant summary</h3>
            <pre className="json-box">
              {riskSummary ? pretty(riskSummary) : "Sin datos cargados"}
            </pre>
          </article>
        </div>
      </section>

      {!hasData && !error ? (
        <section className="section">
          <div className="panel note-panel">
            <p>Endpoints consumidos:</p>
            <ul className="endpoint-list">
              <li>/dashboard/tenant/summary</li>
              <li>/risk-scoring/tenant/summary</li>
              <li>/mail-suppressions/metrics/summary</li>
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
