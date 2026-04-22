#!/bin/bash

# Monitoreo de recursos para CyberAware
# Guarda métricas cada 5 minutos

METRICS_DIR="/var/log/cyberaware-metrics"
mkdir -p $METRICS_DIR

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE=$(date +%Y%m%d)

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Memory Usage
MEMORY_INFO=$(free | grep Mem)
MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
MEMORY_USAGE=$(echo "scale=2; ($MEMORY_USED / $MEMORY_TOTAL) * 100" | bc -l 2>/dev/null || echo "0")

# Disk Usage
DISK_USAGE=$(df -h /opt | awk 'NR==2 {print $5}' | sed 's/%//')

# Network (conexiones activas)
NETWORK_CONNECTIONS=$(netstat -an 2>/dev/null | grep :3000 | grep ESTABLISHED | wc -l)

# Response time
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000 2>/dev/null || echo "0")

# Guardar métricas
echo "$TIMESTAMP,$CPU_USAGE,$MEMORY_USAGE,$DISK_USAGE,$NETWORK_CONNECTIONS,$RESPONSE_TIME" >> $METRICS_DIR/metrics-$DATE.csv

# Verificar umbrales y alertar si es necesario
ALERTS=""

if (( $(echo "$CPU_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
    ALERTS="${ALERTS}CPU alta ($CPU_USAGE%), "
fi

if (( $(echo "$MEMORY_USAGE > 85" | bc -l 2>/dev/null || echo "0") )); then
    ALERTS="${ALERTS}Memoria alta ($MEMORY_USAGE%), "
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    ALERTS="${ALERTS}Disco alto ($DISK_USAGE%), "
fi

if (( $(echo "$RESPONSE_TIME > 5" | bc -l 2>/dev/null || echo "0") )); then
    ALERTS="${ALERTS}Respuesta lenta (${RESPONSE_TIME}s), "
fi

# Si hay alertas, guardar en log de alertas
if [ -n "$ALERTS" ]; then
    echo "$TIMESTAMP: $ALERTS" >> $METRICS_DIR/alerts-$DATE.log
fi
