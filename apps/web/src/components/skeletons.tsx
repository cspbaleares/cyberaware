"use client";

// Skeleton components for loading states

export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ 
        background: "linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%)",
        backgroundSize: "200% 100%",
        borderRadius: "var(--radius-md)",
        animation: "skeleton-loading 1.5s infinite",
        ...style
      }} 
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ opacity: 0.7 }}>
      <div className="card-body">
        <Skeleton style={{ width: "60%", height: 24, marginBottom: "1rem" }} />
        <Skeleton style={{ width: "100%", height: 16, marginBottom: "0.5rem" }} />
        <Skeleton style={{ width: "80%", height: 16 }} />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-card" style={{ opacity: 0.7 }}>
      <Skeleton style={{ width: "40%", height: 14, marginBottom: "0.5rem" }} />
      <Skeleton style={{ width: "60%", height: 36, marginBottom: "0.5rem" }} />
      <Skeleton style={{ width: "50%", height: 14 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th><Skeleton style={{ width: "80%", height: 16 }} /></th>
            <th><Skeleton style={{ width: "60%", height: 16 }} /></th>
            <th><Skeleton style={{ width: "70%", height: 16 }} /></th>
            <th><Skeleton style={{ width: "50%", height: 16 }} /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton style={{ width: "90%", height: 16 }} /></td>
              <td><Skeleton style={{ width: "70%", height: 16 }} /></td>
              <td><Skeleton style={{ width: "80%", height: 16 }} /></td>
              <td><Skeleton style={{ width: "60%", height: 16 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="card">
      <div className="card-body">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="form-group" style={{ marginBottom: "1.5rem" }}>
            <Skeleton style={{ width: "30%", height: 14, marginBottom: "0.5rem" }} />
            <Skeleton style={{ width: "100%", height: 44 }} />
          </div>
        ))}
        <Skeleton style={{ width: "40%", height: 44, marginTop: "1rem" }} />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="page-header">
        <Skeleton style={{ width: "40%", height: 36, marginBottom: "0.5rem" }} />
        <Skeleton style={{ width: "60%", height: 20 }} />
      </div>

      {/* Stats skeleton */}
      <div className="stats-grid">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      {/* Table skeleton */}
      <section className="section">
        <Skeleton style={{ width: "30%", height: 28, marginBottom: "1rem" }} />
        <SkeletonTable rows={5} />
      </section>
    </div>
  );
}
