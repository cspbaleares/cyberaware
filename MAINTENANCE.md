# CyberAware - Mantenimiento Configurado (22 Abril 2026)

## ✅ Tareas de Mantenimiento Automatizadas

### 1. Backups Automáticos
- **Frecuencia:** Diaria a las 2:00 AM
- **Script:** `/opt/platform/scripts/backup-daily.sh`
- **Retención:** 30 días
- **Ubicación:** `/opt/backups/cyberaware/`
- **Contenido:**
  - Código fuente
  - Base de datos (si disponible)
  - Redis (si disponible)
  - Configuración

### 2. Monitoreo de Métricas
- **Frecuencia:** Cada 5 minutos
- **Script:** `/opt/platform/scripts/metrics-collector.sh`
- **Datos recolectados:**
  - Uso de CPU
  - Uso de memoria
  - Uso de disco
  - Conexiones de red
  - Tiempo de respuesta
- **Ubicación:** `/var/log/cyberaware-metrics/`

### 3. Health Check Detallado
- **Script:** `/opt/platform/scripts/health-check-detailed.sh`
- **Verifica:**
  - Servidor web (HTTP 200)
  - API backend
  - Redis
  - Uso de disco
  - Uso de memoria
  - Logs de errores
  - Certificado SSL
  - Backups
  - Repositorio Git

### 4. Rotación de Logs
- **Configuración:** `/etc/logrotate.d/cyberaware`
- **Frecuencia:** Diaria
- **Retención:** 14 días
- **Compresión:** Sí (delaycompress)

## 📊 Estado Actual del Sistema

### Recursos (22 Abril 2026, 19:15)
- **Web Server:** HTTP 200 OK (89ms)
- **Disco:** 22% usado (21G/96G)
- **Memoria:** 2.6G usada / 11G total
- **Procesos Next.js:** 2 activos
- **Backups:** Disponibles

### Seguridad
- ✅ CSP Headers configurados
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ HSTS habilitado
- ✅ Puertos: 3000 (web), 3001 (API)

### Sentry
- ✅ DSN configurado
- ✅ Client, Server y Edge configs
- ✅ Session Replay activado
- ✅ Performance monitoring

## 🔧 Comandos Útiles

```bash
# Verificar salud
/opt/platform/scripts/health-check-detailed.sh

# Backup manual
/opt/platform/scripts/backup-daily.sh

# Ver métricas recientes
tail -20 /var/log/cyberaware-metrics/metrics-$(date +%Y%m%d).csv

# Ver alertas
cat /var/log/cyberaware-metrics/alerts-$(date +%Y%m%d).log

# Ver crontab
crontab -l
```

## 📈 Próximos Pasos Recomendados

1. **Configurar alertas por email** cuando hayan errores críticos
2. **Revisar métricas semanalmente** para detectar tendencias
3. **Probar restauración de backup** mensualmente
4. **Actualizar dependencias** npm mensualmente
5. **Revisar logs de Sentry** semanalmente

## 🚨 Alertas Configuradas

El sistema alertará cuando:
- Uso de CPU > 80%
- Uso de memoria > 85%
- Uso de disco > 80%
- Tiempo de respuesta > 5 segundos
- SSL a punto de expirar (< 7 días)

---
*Configuración completada: 22 Abril 2026*
*Próxima revisión recomendada: 29 Abril 2026*
