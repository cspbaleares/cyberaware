#!/bin/bash

# Backup Automático Diario para CyberAware
# Añadir a crontab: 0 2 * * * /opt/platform/scripts/backup-daily.sh

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/opt/backups/cyberaware"
APP_DIR="/opt/platform"
RETENTION_DAYS=30

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

# Backup del código fuente
echo "[$(date)] Creando backup del código fuente..."
tar -czf $BACKUP_DIR/backup-code-$TIMESTAMP.tar.gz -C $APP_DIR src/app/apps/web

# Backup de la base de datos (si existe)
if command -v pg_dump &> /dev/null; then
    echo "[$(date)] Creando backup de la base de datos..."
    pg_dump -h localhost -U postgres cyberaware > $BACKUP_DIR/backup-db-$TIMESTAMP.sql 2>/dev/null || echo "DB backup skipped"
fi

# Backup de Redis (si está corriendo)
if command -v redis-cli &> /dev/null && redis-cli ping &>/dev/null; then
    echo "[$(date)] Creando backup de Redis..."
    redis-cli BGSAVE
    cp /var/lib/redis/dump.rdb $BACKUP_DIR/backup-redis-$TIMESTAMP.rdb 2>/dev/null || echo "Redis backup skipped"
fi

# Backup de configuración
echo "[$(date)] Creando backup de configuración..."
tar -czf $BACKUP_DIR/backup-config-$TIMESTAMP.tar.gz -C $APP_DIR .env* docker-compose*.yml nginx 2>/dev/null || true

# Limpiar backups antiguos
echo "[$(date)] Limpiando backups antiguos (> $RETENTION_DAYS días)..."
find $BACKUP_DIR -name "backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "backup-*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "backup-*.rdb" -mtime +$RETENTION_DAYS -delete

# Verificar espacio en disco
DISK_USAGE=$(df -h /opt | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[$(date)] ⚠️ ALERTA: Uso de disco alto ($DISK_USAGE%)"
    # Enviar notificación (si está configurada)
    echo "Disk usage alert: $DISK_USAGE%" | mail -s "CyberAware Backup Alert" admin@cspcybersecurity.com 2>/dev/null || true
fi

echo "[$(date)] ✅ Backup completado: backup-code-$TIMESTAMP.tar.gz"

# Listar backups recientes
echo ""
echo "Backups recientes:"
ls -lh $BACKUP_DIR | tail -5
