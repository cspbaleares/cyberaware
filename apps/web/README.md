# Web app

Frontend Next.js de la plataforma.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Convención de rutas del módulo 1

Para evitar 404s entre UI y App Router:

- La navegación visible para usuario puede usar slugs en español:
  - `/module-1/plantillas`
  - `/module-1/bloqueos`
  - `/module-1/panel`
- Las pantallas base existentes están implementadas en:
  - `/module-1/templates`
  - `/module-1/suppressions`
  - `/module-1/dashboard`

### Regla operativa

Si se añaden enlaces nuevos en la UI del módulo 1, hay que hacer una de estas dos cosas:

1. usar directamente la ruta real del directorio en `src/app`, o
2. crear un alias explícito si el slug visible va a estar en español.

### Alias actualmente necesarios

Se mantienen aliases para que la UI en español no rompa:

- `src/app/module-1/plantillas/page.tsx` → reexporta `../templates/page`
- `src/app/module-1/bloqueos/page.tsx` → reexporta `../suppressions/page`
- `src/app/module-1/panel/page.tsx` → reexporta `../dashboard/page`

### Checklist antes de subir a staging

- comprobar que cada `Link href="..."` apunta a una ruta existente
- revisar `src/components/module-1-subnav.tsx`
- probar manualmente:
  - `/module-1`
  - `/module-1/plantillas`
  - `/module-1/domains`
  - `/module-1/campaigns`
  - `/module-1/bloqueos`
  - `/module-1/panel`
