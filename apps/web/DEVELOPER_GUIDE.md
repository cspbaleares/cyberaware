# Guía de Desarrollo - CyberAware Frontend

## Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js (App Router)
│   ├── layout.tsx         # Layout raíz con TopNav y ToastProvider
│   ├── page.tsx           # Landing page / Dashboard
│   ├── login/page.tsx     # Página de login
│   ├── globals.css        # Estilos globales y CSS variables
│   ├── not-found.tsx      # Página 404
│   ├── error.tsx          # Página de error 500
│   ├── module-1/          # Simulación
│   ├── module-2/          # Riesgo Humano
│   ├── module-3/          # Formación
│   └── module-4/          # Automatización
├── components/            # Componentes reutilizables
│   ├── top-nav.tsx        # Navegación superior
│   ├── skeletons.tsx      # Loading skeletons
│   └── toast.tsx          # Sistema de notificaciones
├── lib/                   # Utilidades
│   ├── config.ts          # Configuración de la app
│   └── server-session.ts  # Manejo de sesión
└── styles/               # Estilos adicionales (si los hay)
```

## Sistema de Diseño

### CSS Variables (Design Tokens)

```css
/* Colores */
--bg-primary: #0B0F19
--bg-secondary: #111827
--bg-tertiary: #1F2937
--brand-500: #3B82F6
--success-500: #10B981
--warning-500: #F59E0B
--error-500: #EF4444

/* Espaciado */
--space-1: 0.25rem
--space-2: 0.5rem
--space-4: 1rem
--space-6: 1.5rem
--space-8: 2rem

/* Tipografía */
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem

/* Bordes */
--radius-md: 0.375rem
--radius-lg: 0.5rem
--radius-xl: 0.75rem
```

### Componentes CSS

#### Botones
```tsx
// Variantes
<button className="btn btn-primary">Primario</button>
<button className="btn btn-secondary">Secundario</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-danger">Peligro</button>

// Tamaños
<button className="btn btn-sm">Pequeño</button>
<button className="btn btn-lg">Grande</button>
```

#### Cards
```tsx
// Card básica
<div className="card">
  <div className="card-body">Contenido</div>
</div>

// Card elevada (con sombra)
<div className="card card-elevated">...</div>

// Card con hover
<div className="card card-hover">...</div>
```

#### Formularios
```tsx
<div className="form-group">
  <label className="form-label">Label</label>
  <input className="form-input" type="text" />
  <p className="form-hint">Texto de ayuda</p>
</div>
```

#### Badges
```tsx
<span className="badge badge-green">Éxito</span>
<span className="badge badge-amber">Advertencia</span>
<span className="badge badge-red">Error</span>
<span className="badge badge-blue">Info</span>
<span className="badge badge-gray">Neutral</span>
```

#### Tablas
```tsx
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Columna 1</th>
        <th>Columna 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dato 1</td>
        <td>Dato 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Layout

#### Grid System
```tsx
// 2 columnas
<div className="grid grid-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// 3 columnas (responsive)
<div className="grid grid-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

#### Stats Grid
```tsx
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-label">Label</div>
    <div className="stat-value">123</div>
    <div className="stat-change">+5%</div>
  </div>
</div>
```

## Patrones de Uso

### Página Básica
```tsx
import Link from "next/link";
import { getCurrentSession } from "@/lib/server-session";

export default async function MyPage() {
  const session = await getCurrentSession();
  
  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Página Actual</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Título</h1>
        <p className="page-description">Descripción</p>
      </div>

      {/* Contenido */}
      <section className="section">
        {/* ... */}
      </section>
    </div>
  );
}
```

### Uso de Toasts
```tsx
"use client";

import { useToast } from "@/components/toast";

export default function MyComponent() {
  const { showToast } = useToast();
  
  const handleAction = () => {
    showToast("Operación exitosa", "success");
    showToast("Algo salió mal", "error");
    showToast("Ten cuidado", "warning");
    showToast("Información", "info");
  };
}
```

### Loading States
```tsx
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeletons";

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActualContent />
    </Suspense>
  );
}
```

## Convenciones

### Nombres de Archivos
- Páginas: `page.tsx`
- Layouts: `layout.tsx`
- Componentes: `PascalCase.tsx`
- Utilidades: `camelCase.ts`
- Estilos: `kebab-case.css`

### Imports
```tsx
// Orden recomendado:
// 1. React/Next
// 2. Componentes
// 3. Utilidades
// 4. Estilos

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { getCurrentSession } from "@/lib/server-session";
import "./globals.css";
```

### CSS
- Usar clases utilitarias del sistema de diseño
- Evitar estilos inline (solo para casos específicos)
- Usar CSS variables para consistencia
- Mobile-first responsive design

## Comandos

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Deploy a staging
./scripts/deploy.sh staging

# Deploy a producción
./scripts/deploy.sh production
```

## Recursos Externos

- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev
- CSS Variables: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
