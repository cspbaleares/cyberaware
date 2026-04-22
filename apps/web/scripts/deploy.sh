#!/bin/bash

# CyberAware Frontend Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/opt/backups/cyberaware"

echo "🚀 CyberAware Frontend Deployment"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Date: $DATE"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Determine paths based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    SOURCE_DIR="/opt/platform-staging/src/app/apps/web"
    TARGET_DIR="/opt/platform/src/app/apps/web"
    PORT="3000"
    SERVICE_NAME="cyberaware-prod"
else
    SOURCE_DIR="/opt/platform-staging/src/app/apps/web"
    TARGET_DIR="/opt/platform-staging/src/app/apps/web"
    PORT="3100"
    SERVICE_NAME="cyberaware-staging"
fi

# Step 1: Pre-deployment checks
log_info "Step 1: Pre-deployment checks"

if [ ! -d "$SOURCE_DIR" ]; then
    log_error "Source directory not found: $SOURCE_DIR"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/package.json" ]; then
    log_error "package.json not found in source"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$SOURCE_DIR/node_modules" ]; then
    log_warn "node_modules not found, running npm install..."
    cd "$SOURCE_DIR"
    npm install
fi

# Step 2: Build
log_info "Step 2: Building application..."
cd "$SOURCE_DIR"

# Clean previous build
rm -rf .next

# Build
if npm run build; then
    log_info "Build successful"
else
    log_error "Build failed"
    exit 1
fi

# Step 3: Backup (only for production)
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "Step 3: Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$TARGET_DIR" ]; then
        tar -czf "$BACKUP_DIR/backup-$DATE.tar.gz" -C "$(dirname $TARGET_DIR)" "$(basename $TARGET_DIR)"
        log_info "Backup created: $BACKUP_DIR/backup-$DATE.tar.gz"
    fi
fi

# Step 4: Deploy
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "Step 4: Deploying to production..."
    
    # Stop current service
    log_info "Stopping current service..."
    fuser -k $PORT/tcp 2>/dev/null || true
    sleep 2
    
    # Copy files
    log_info "Copying files..."
    rsync -av --delete --exclude='node_modules' --exclude='.next' \
        "$SOURCE_DIR/" "$TARGET_DIR/"
    
    # Install dependencies in target
    cd "$TARGET_DIR"
    npm install --production
    
    # Start service
    log_info "Starting service..."
    nohup npm run start -- --port $PORT > /var/log/cyberaware.log 2>&1 &
    
    # Wait for service to start
    sleep 5
    
    # Health check
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT | grep -q "200\|307"; then
        log_info "Service started successfully"
    else
        log_error "Service failed to start"
        exit 1
    fi
else
    log_info "Step 4: Restarting staging service..."
    
    # Just restart the dev server
    fuser -k $PORT/tcp 2>/dev/null || true
    sleep 2
    
    cd "$TARGET_DIR"
    nohup npm run dev -- --port $PORT > /tmp/web-staging.log 2>&1 &
    
    sleep 5
    
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT | grep -q "200\|307"; then
        log_info "Staging service restarted"
    else
        log_error "Failed to restart staging"
        exit 1
    fi
fi

# Step 5: Post-deployment verification
log_info "Step 5: Post-deployment verification"

# Check main routes
ROUTES=("/" "/login" "/module-1" "/module-2" "/module-3" "/module-4")
FAILED=0

for route in "${ROUTES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT$route")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ]; then
        log_info "✓ $route - OK ($STATUS)"
    else
        log_error "✗ $route - Failed ($STATUS)"
        FAILED=$((FAILED + 1))
    fi
done

# Summary
echo ""
echo "=================================="
if [ $FAILED -eq 0 ]; then
    log_info "Deployment completed successfully!"
    echo ""
    echo "URLs:"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  - https://dev.cyberaware.cspcybersecurity.com"
    else
        echo "  - http://127.0.0.1:$PORT"
    fi
else
    log_warn "Deployment completed with $FAILED warnings"
fi

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "Backup location: $BACKUP_DIR/backup-$DATE.tar.gz"
    echo "To rollback: tar -xzf $BACKUP_DIR/backup-$DATE.tar.gz -C $(dirname $TARGET_DIR)"
fi

echo ""
echo "Done!"
