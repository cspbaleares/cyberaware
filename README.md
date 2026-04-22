# CyberAware - Security Awareness Platform

Plataforma de Security Awareness para reducir el riesgo humano en organizaciones.

## 🚀 Características

### Core
- ✅ Simulaciones de phishing realistas
- ✅ Análisis de riesgo humano
- ✅ Formación personalizada
- ✅ Automatización inteligente

### Mejoras Implementadas

#### UI/UX
- 🎨 **Modo oscuro/claro** - Toggle con persistencia
- 🌍 **Internacionalización** - Soporte ES/EN
- 📊 **Dashboard de analytics** - Gráficos en tiempo real
- 🔔 **Toast notifications** - Feedback instantáneo
- 📱 **PWA** - Instalable, funciona offline

#### Performance
- ⚡ **Redis** - Caché de sesiones y datos
- 🛡️ **Rate limiting** - Protección contra abuso
- 🗜️ **Compresión** - Gzip/Brotli habilitado
- 🖼️ **Optimización de imágenes** - WebP/AVIF

#### Seguridad
- 🔒 **CSP Headers** - Content Security Policy
- 🔐 **HSTS** - HTTPS estricto
- 📝 **Validación Zod** - Inputs validados
- 🚫 **X-Frame-Options** - Protección clickjacking

#### DevOps
- 🔄 **CI/CD** - GitHub Actions
- 📊 **Monitoreo** - Dashboard de métricas
- 🐛 **Sentry** - Tracking de errores
- 🧪 **Tests** - Jest + Testing Library
- 🔧 **SSL** - Let's Encrypt automático

## 📁 Estructura del Proyecto

```
/opt/platform/
├── src/app/apps/web/          # Frontend Next.js 16
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/        # Componentes React
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilidades
│   │   └── styles/            # CSS
│   └── public/                # Assets estáticos
├── deploy.sh                  # Script de despliegue
├── health-check.sh            # Verificación de salud
└── docker-compose.redis.yml   # Redis + Web
```

## 🛠️ Instalación

### Requisitos
- Node.js 22+
- Redis (opcional, para caché)
- Nginx (para producción)

### Setup

```bash
# Clonar repositorio
git clone https://github.com/cspbaleares/cyberaware.git
cd cyberaware/src/app/apps/web

# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 🚀 Despliegue

### Automático (con script)

```bash
# Staging
./deploy.sh staging

# Producción
./deploy.sh production
```

### Manual

```bash
# Backup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz src/app/apps/web

# Deploy
cd /opt/platform/src/app/apps/web
git pull origin main
npm ci --legacy-peer-deps
npm run build
pm2 restart cyberaware-production
```

## 🔧 Configuración

### Variables de Entorno

```env
# API
NEXT_PUBLIC_API_URL=https://api.cyberaware.cspcybersecurity.com

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN=https://...

# App
NEXT_PUBLIC_APP_NAME=CyberAware
NEXT_PUBLIC_APP_URL=https://dev.cyberaware.cspcybersecurity.com
```

### SSL (Let's Encrypt)

```bash
sudo ./scripts/setup-ssl.sh production
```

### Redis con Docker

```bash
docker-compose -f docker-compose.redis.yml up -d
```

## 📊 Monitoreo

### Métricas disponibles en:
- `/admin/metrics` - Dashboard de sistema
- `/admin` - Panel de administración

### Health Check
```bash
./health-check.sh production
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📝 Scripts Útiles

| Script | Descripción |
|--------|-------------|
| `deploy.sh` | Despliegue automático con backup |
| `health-check.sh` | Verificación de salud del sistema |
| `setup-ssl.sh` | Configuración SSL con Let's Encrypt |

## 🔐 Seguridad

- CSP headers configurados
- Rate limiting por IP
- Validación de inputs con Zod
- Headers de seguridad (HSTS, X-Frame-Options)
- Protección contra XSS y CSRF

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -am 'feat: nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Propietario - CSP Baleares

## 🆘 Soporte

Para soporte técnico, contactar a: admin@cspcybersecurity.com
