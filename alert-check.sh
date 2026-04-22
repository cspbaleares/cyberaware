#!/bin/bash

# Sistema de alertas para CyberAware
# Envía notificaciones cuando se detectan problemas

ALERT_EMAIL="admin@cspcybersecurity.com"
ALERT_LOG="/var/log/cyberaware-alerts.log"

# Función para enviar alerta
send_alert() {
    local subject="$1"
    local message="$2"
    local priority="$3" # high, medium, low
    
    # Loguear alerta
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$priority] $subject: $message" >> $ALERT_LOG
    
    # Enviar email (si mail está configurado)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "[CyberAware][$priority] $subject" $ALERT_EMAIL
    fi
    
    # Enviar a Slack (si está configurado)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[CyberAware][$priority] $subject: $message\"}" \
            $SLACK_WEBHOOK_URL 2>/dev/null || true
    fi
    
    # Enviar a Telegram (si está configurado)
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=[CyberAware][$priority] $subject: $message" 2>/dev/null || true
    fi
}

# Verificar servidor web
if ! curl -f -s http://localhost:3000 > /dev/null; then
    send_alert "Servidor Web Caído" "El servidor web no responde en puerto 3000" "high"
fi

# Verificar uso de disco
DISK_USAGE=$(df -h /opt | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    send_alert "Disco Crítico" "Uso de disco: $DISK_USAGE%" "high"
elif [ "$DISK_USAGE" -gt 80 ]; then
    send_alert "Disco Alto" "Uso de disco: $DISK_USAGE%" "medium"
fi

# Verificar uso de memoria
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    send_alert "Memoria Crítica" "Uso de memoria: $MEMORY_USAGE%" "high"
elif [ "$MEMORY_USAGE" -gt 80 ]; then
    send_alert "Memoria Alta" "Uso de memoria: $MEMORY_USAGE%" "medium"
fi

# Verificar errores en logs (últimos 10 minutos)
ERROR_COUNT=$(find /opt/platform/src/app/apps/web/.next -name "*.log" -mmin -10 2>/dev/null | xargs grep -i "error" 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -gt 10 ]; then
    send_alert "Muchos Errores" "$ERROR_COUNT errores en los últimos 10 minutos" "medium"
fi

# Verificar SSL (si aplica)
if [ -f /etc/letsencrypt/live/dev.cyberaware.cspcybersecurity.com/fullchain.pem ]; then
    EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/dev.cyberaware.cspcybersecurity.com/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -lt 3 ]; then
        send_alert "SSL Expirando" "Certificado SSL expira en $DAYS_LEFT días" "high"
    elif [ "$DAYS_LEFT" -lt 7 ]; then
        send_alert "SSL Próximo a Expirar" "Certificado SSL expira en $DAYS_LEFT días" "medium"
    fi
fi

# Verificar backup reciente
LATEST_BACKUP=$(find /opt/backups/cyberaware -name "backup-code-*.tar.gz" -mtime -1 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ]; then
    send_alert "Sin Backup Reciente" "No hay backup en las últimas 24 horas" "high"
fi
