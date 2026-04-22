import Link from "next/link";

const supportItems = [
  { href: "/module-1", label: "Resumen" },
  { href: "/module-1/panel", label: "Panel" },
  { href: "/module-1/bloqueos", label: "Bloqueos" },
];

const processItems = [
  { href: "/module-1/plantillas", label: "Plantillas" },
  { href: "/module-1/domains", label: "Dominios" },
  { href: "/module-1/campaigns", label: "Campañas" },
];

function renderItems(items: { href: string; label: string }[], currentPath: string) {
  return items.map((item) => {
    const active = currentPath === item.href;
    return (
      <Link
        key={item.href}
        className={active ? "button-primary" : "button-secondary"}
        href={item.href}
      >
        {item.label}
      </Link>
    );
  });
}

export function Module1Subnav({ currentPath }: { currentPath: string }) {
  return (
    <div className="subnav-grid">
      <div className="panel subnav-section">
        <div className="meta-label" style={{ marginBottom: 8 }}>Control y soporte</div>
        <div className="subnav-links">{renderItems(supportItems, currentPath)}</div>
      </div>

      <div className="panel subnav-section">
        <div className="meta-label" style={{ marginBottom: 8 }}>Proceso principal</div>
        <div className="subnav-links">{renderItems(processItems, currentPath)}</div>
      </div>
    </div>
  );
}
