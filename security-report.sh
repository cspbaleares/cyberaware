#!/bin/bash

# Informe de Seguridad para CyberAware
# Ejecutar diariamente: 0 6 * * * /opt/platform/scripts/security-report.sh

REPORT_FILE="/var/log/cyberaware-security-report-$(date +%Y%m%d).log"
ATTEMPTS_LOG="/var/log/cyberaware-attacks.log"
ALERT_EMAIL="incidentes@cspbaleares.com"

echo "=== INFORME DE SEGURIDAD - $(date) ===" > $REPORT_FILE
echo "" >> $REPORT_FILE

# 1. Intentos de ataque en las últimas 24h
echo "1. INTENTOS DE ATAQUE (últimas 24h):" >> $REPORT_FILE
echo "----------------------------------------" >> $REPORT_FILE

# Buscar patrones de ataque
ATTACK_PATTERNS="\.env|\.git|admin|wp-login|phpmyadmin|config\.xml|\.htaccess|/api/|/wp-content|/wp-includes|/administrator|/admin\.php|/login\.php|/setup\.php|/install\.php|/config\.php|/database\.php|/db\.php|/backup|/dump|/sql|/temp|/tmp|/test|/old|/new|/dev|/staging|/prod|/production|/beta|/alpha|/demo|/sample|/example|/test|/testing|/debug|/console|/shell|/cmd|/command|/exec|/eval|/system|/proc|/sys|/root|/etc|/var|/home|/usr|/bin|/sbin|/lib|/lib64|/opt|/mnt|/media|/srv|/run|/boot|/snap"

ATTACK_COUNT=$(grep -E "$ATTACK_PATTERNS" /var/log/nginx/access.log 2>/dev/null | wc -l)
echo "Total intentos sospechosos: $ATTACK_COUNT" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Top 10 IPs atacantes
echo "Top IPs con comportamiento sospechoso:" >> $REPORT_FILE
grep -E "$ATTACK_PATTERNS" /var/log/nginx/access.log 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -10 >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 2. Verificar headers de seguridad
echo "2. HEADERS DE SEGURIDAD:" >> $REPORT_FILE
echo "------------------------" >> $REPORT_FILE
curl -s -I http://localhost:3000 | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 3. Estado de SSL
echo "3. ESTADO SSL:" >> $REPORT_FILE
echo "--------------" >> $REPORT_FILE
if [ -f /etc/letsencrypt/live/cyberaware.cspcybersecurity.com/fullchain.pem ]; then
    EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/cyberaware.cspcybersecurity.com/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)
    echo "Certificado válido hasta: $EXPIRY" >> $REPORT_FILE
else
    echo "⚠️ No se encontró certificado SSL" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 4. Errores 404 recientes (posibles escaneos)
echo "4. ERRORES 404 RECIENTES (Top 10):" >> $REPORT_FILE
echo "-----------------------------------" >> $REPORT_FILE
grep " 404 " /var/log/nginx/access.log 2>/dev/null | awk '{print $7}' | sort | uniq -c | sort -rn | head -10 >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 5. Resumen
echo "5. RESUMEN:" >> $REPORT_FILE
echo "-----------" >> $REPORT_FILE
echo "Fecha: $(date)" >> $REPORT_FILE
echo "Intentos de ataque 24h: $ATTACK_COUNT" >> $REPORT_FILE
echo "Estado: $(if [ $ATTACK_COUNT -gt 1000 ]; then echo "⚠️ ALTO"; elif [ $ATTACK_COUNT -gt 500 ]; then echo "⚠️ MEDIO"; else echo "✅ NORMAL"; fi)" >> $REPORT_FILE

echo "Informe guardado en: $REPORT_FILE"

# Enviar informe por email
if command -v mail &> /dev/null; then
    mail -s "[CyberAware] Informe de Seguridad Diario - $(date +%Y-%m-%d)" $ALERT_EMAIL < $REPORT_FILE
fi

# Si hay muchos ataques, enviar alerta adicional
if [ $ATTACK_COUNT -gt 1000 ]; then
    echo "ALERTA: Alto número de intentos de ataque ($ATTACK_COUNT) en las últimas 24h. Revise el informe adjunto." | mail -s "[CyberAware] ALERTA: Alto número de ataques detectados" $ALERT_EMAIL 2>/dev/null || true
fi
