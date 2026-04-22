# Plan de Pruebas - CyberAware Frontend

## 1. Pruebas de Navegación

### Rutas Públicas
- [ ] `/` - Landing page carga correctamente
- [ ] `/login` - Formulario de login visible
- [ ] Navegación entre landing y login funciona

### Rutas Protegidas (sin auth)
- [ ] `/module-1` → Redirige a login
- [ ] `/module-2` → Redirige a login
- [ ] `/module-3` → Redirige a login
- [ ] `/module-4` → Redirige a login

### Rutas Protegidas (con auth)
- [ ] `/module-1` - Overview carga
- [ ] `/module-1/domains` - Página de dominios
- [ ] `/module-1/campaigns` - Página de campañas
- [ ] `/module-1/templates` - Página de plantillas
- [ ] `/module-1/suppressions` - Página de supresiones
- [ ] `/module-1/dashboard` - Dashboard del módulo
- [ ] `/module-2` - Riesgo humano
- [ ] `/module-3` - Formación
- [ ] `/module-4` - Automatización

## 2. Pruebas de UI/UX

### Layout
- [ ] TopNav visible en todas las páginas
- [ ] Logo clickable (vuelve a home)
- [ ] Links de navegación funcionan
- [ ] User menu (cuando está autenticado)

### Responsive
- [ ] Desktop (>1024px) - Layout correcto
- [ ] Tablet (768-1024px) - Layout adaptado
- [ ] Mobile (<768px) - Layout móvil

### Tema
- [ ] Dark theme aplicado consistentemente
- [ ] Contraste de texto legible
- [ ] Colores de marca correctos

## 3. Pruebas de Componentes

### Botones
- [ ] Primary button - Hover y click
- [ ] Secondary button - Hover y click
- [ ] Ghost button - Hover y click
- [ ] Disabled state

### Cards
- [ ] Hover effects funcionan
- [ ] Sombras correctas
- [ ] Padding interno consistente

### Formularios
- [ ] Inputs focus state
- [ ] Labels asociados correctamente
- [ ] Validación visual (required)
- [ ] Selects con flecha custom

### Tablas
- [ ] Headers estilizados
- [ ] Rows con hover
- [ ] Badges de estado visibles
- [ ] Scroll horizontal si es necesario

### Stats
- [ ] 4 columnas en desktop
- [ ] 2 columnas en tablet
- [ ] 1 columna en móvil
- [ ] Valores y labels correctos

## 4. Pruebas de Funcionalidad

### Login
- [ ] Login con credenciales válidas
- [ ] Login con credenciales inválidas (mensaje de error)
- [ ] MFA si está habilitado
- [ ] Logout funciona

### Módulo 1 - Simulación
- [ ] Ver lista de dominios
- [ ] Crear dominio (formulario)
- [ ] Ver lista de campañas
- [ ] Ver lista de plantillas
- [ ] Preview de plantilla
- [ ] Ver supresiones

### Módulo 2 - Riesgo
- [ ] Ver distribución de riesgo
- [ ] Ver lista de usuarios
- [ ] Recalcular riesgo

### Módulo 3 - Formación
- [ ] Ver lista de cursos
- [ ] Ver progreso de formación

### Módulo 4 - Automatización
- [ ] Ver lista de reglas
- [ ] Crear regla (formulario)
- [ ] Activar/pausar regla
- [ ] Ver intervenciones

## 5. Pruebas de Error

### 404
- [ ] Página 404 personalizada se muestra
- [ ] Botón "Volver al inicio" funciona
- [ ] Botón "Ir atrás" funciona

### 500
- [ ] Página de error se muestra si hay excepción
- [ ] Botón "Intentar de nuevo" funciona

### Offline
- [ ] Mensaje apropiado si no hay conexión

## 6. Pruebas de Performance

### Carga
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s

### Bundle
- [ ] JavaScript < 500KB (gzipped)
- [ ] CSS < 50KB (gzipped)

## 7. Pruebas de Accesibilidad

### Teclado
- [ ] Navegación completa con Tab
- [ ] Focus visible en todos los elementos
- [ ] Enter/Space activan botones
- [ ] Escape cierra modales (si hay)

### Screen Reader
- [ ] Headings anunciados correctamente
- [ ] Labels de formularios asociados
- [ ] Botones tienen texto o aria-label

### Contraste
- [ ] Texto principal: ratio > 4.5:1
- [ ] Texto grande: ratio > 3:1

## 8. Pruebas de SEO

### Meta tags
- [ ] Title correcto en cada página
- [ ] Description presente
- [ ] Keywords presentes
- [ ] Viewport configurado

### Open Graph
- [ ] og:title presente
- [ ] og:description presente

### Archivos
- [ ] robots.txt accesible
- [ ] sitemap.xml accesible
- [ ] favavicon visible

## 9. Pruebas de Seguridad

### Headers
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy

### Contenido
- [ ] No hay datos sensibles en el HTML
- [ ] Tokens no expuestos en el cliente

## 10. Pruebas de Compatibilidad

### Navegadores
- [ ] Chrome/Edge (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)

### Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Móvil (375x667)

---

## Resultados

| Categoría | Estado | Notas |
|-----------|--------|-------|
| Navegación | ⏳ Pendiente | |
| UI/UX | ⏳ Pendiente | |
| Componentes | ⏳ Pendiente | |
| Funcionalidad | ⏳ Pendiente | |
| Error | ⏳ Pendiente | |
| Performance | ⏳ Pendiente | |
| Accesibilidad | ⏳ Pendiente | |
| SEO | ⏳ Pendiente | |
| Seguridad | ⏳ Pendiente | |
| Compatibilidad | ⏳ Pendiente | |

**Leyenda:**
- ✅ Pasado
- ❌ Fallido
- ⏳ Pendiente
- ⚠️ Con observaciones
