#!/bin/bash

# Limpieza de caché y archivos temporales
# Ejecutar semanalmente: 0 3 * * 0 /opt/platform/scripts/cleanup.sh

echo "=== LIMPIEZA DE SISTEMA - $(date) ==="
echo ""

# Limpiar caché de Next.js
echo "1. Limpiando caché de Next.js..."
rm -rf /opt/platform/src/app/apps/web/.next/cache/*
echo "   ✓ Caché de Next.js limpiado"

# Limpiar logs antiguos
echo ""
echo "2. Limpiando logs antiguos..."
find /var/log -name "*.log.*" -mtime +30 -delete 2>/dev/null || true
find /opt/platform/src/app/apps/web/.next -name "*.log" -mtime +7 -delete 2>/dev/null || true
echo "   ✓ Logs antiguos eliminados"

# Limpiar archivos temporales
echo ""
echo "3. Limpiando archivos temporales..."
rm -rf /tmp/cyberaware-*
rm -rf /opt/platform/src/app/apps/web/node_modules/.cache/*
echo "   ✓ Archivos temporales eliminados"

# Limpiar métricas antiguas
echo ""
echo "4. Limpiando métricas antiguas..."
find /var/log/cyberaware-metrics -name "metrics-*.csv" -mtime +90 -delete 2>/dev/null || true
find /var/log/cyberaware-metrics -name "alerts-*.log" -mtime +90 -delete 2>/dev/null || true
echo "   ✓ Métricas antiguas eliminadas"

# Verificar espacio liberado
echo ""
echo "5. Estado del disco después de la limpieza:"
df -h /opt | tail -1

echo ""
echo "=== LIMPIEZA COMPLETADA ==="
