#!/bin/bash

# Verificación de salud del sistema CyberAware
# Usage: ./health-check-detailed.sh

set -e

echo "=== HEALTH CHECK DETALLADO - $(date) ==="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_service() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $name: $message"
    elif [ "$status" -eq 1 ]; then
        echo -e "${YELLOW}⚠${NC} $name: $message"
        ((WARNINGS++))
    else
        echo -e "${RED}✗${NC} $name: $message"
        ((ERRORS++))
    fi
}

# 1. Verificar servidor web
echo "1. Servidor Web..."
if curl -f -s http://localhost:3000 > /dev/null; then
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000)
    check_service "Web Server" 0 "HTTP 200 OK (${RESPONSE_TIME}s)"
else
    check_service "Web Server" 2 "No responde"
fi

# 2. Verificar API
echo ""
echo "2. API Backend..."
if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
    check_service "API" 0 "Funcionando"
else
    check_service "API" 1 "No disponible o en otro puerto"
fi

# 3. Verificar Redis
echo ""
echo "3. Redis..."
if redis-cli ping > /dev/null 2>&1; then
    REDIS_INFO=$(redis-cli info | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    check_service "Redis" 0 "Conectado ($REDIS_INFO)"
else
    check_service "Redis" 1 "No conectado (opcional)"
fi

# 4. Verificar disco
echo ""
echo "4. Uso de Disco..."
DISK_USAGE=$(df -h /opt | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 70 ]; then
    check_service "Disco" 0 "$DISK_USAGE% usado"
elif [ "$DISK_USAGE" -lt 85 ]; then
    check_service "Disco" 1 "$DISK_USAGE% usado"
else
    check_service "Disco" 2 "$DISK_USAGE% usado - CRÍTICO"
fi

# 5. Verificar memoria
echo ""
echo "5. Uso de Memoria..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -lt 70 ]; then
    check_service "Memoria" 0 "$MEMORY_USAGE% usada"
elif [ "$MEMORY_USAGE" -lt 85 ]; then
    check_service "Memoria" 1 "$MEMORY_USAGE% usada"
else
    check_service "Memoria" 2 "$MEMORY_USAGE% usada - CRÍTICO"
fi

# 6. Verificar logs de errores recientes
echo ""
echo "6. Logs de Errores (última hora)..."
ERROR_COUNT=$(find /opt/platform/src/app/apps/web/.next -name "*.log" -mmin -60 2>/dev/null | xargs grep -i "error" 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    check_service "Logs" 0 "Sin errores recientes"
else
    check_service "Logs" 1 "$ERROR_COUNT errores en la última hora"
fi

# 7. Verificar SSL (si aplica)
echo ""
echo "7. Certificado SSL..."
if command -v openssl &> /dev/null && [ -f /etc/letsencrypt/live/dev.cyberaware.cspcybersecurity.com/fullchain.pem ]; then
    EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/dev.cyberaware.cspcybersecurity.com/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -gt 30 ]; then
        check_service "SSL" 0 "Válido por $DAYS_LEFT días"
    elif [ "$DAYS_LEFT" -gt 7 ]; then
        check_service "SSL" 1 "Expira en $DAYS_LEFT días"
    else
        check_service "SSL" 2 "Expira en $DAYS_LEFT días - RENOVAR"
    fi
else
    check_service "SSL" 1 "No configurado"
fi

# 8. Verificar backups
echo ""
echo "8. Backups..."
LATEST_BACKUP=$(find /opt/backups/cyberaware -name "backup-code-*.tar.gz" -mtime -1 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    check_service "Backup" 0 "Reciente disponible ($BACKUP_SIZE)"
else
    check_service "Backup" 1 "No hay backup en las últimas 24h"
fi

# 9. Verificar GitHub
echo ""
echo "9. Repositorio Git..."
cd /opt/platform/src/app
if git rev-parse --git-dir > /dev/null 2>&1; then
    LAST_COMMIT=$(git log -1 --format="%h - %s (%cr)")
    check_service "Git" 0 "$LAST_COMMIT"
else
    check_service "Git" 2 "No es un repositorio git"
fi

# Resumen
echo ""
echo "==================================="
echo "RESUMEN:"
echo -e "${GREEN}✓${NC} OK: $(( 9 - WARNINGS - ERRORS ))"
echo -e "${YELLOW}⚠${NC} Advertencias: $WARNINGS"
echo -e "${RED}✗${NC} Errores: $ERRORS"
echo "==================================="

if [ $ERRORS -gt 0 ]; then
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    exit 2
else
    exit 0
fi
