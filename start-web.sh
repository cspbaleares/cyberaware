#!/usr/bin/env bash
set -e
cd /opt/platform/src/app/apps/web
rm -rf .next
exec env PORT="${PORT:-3000}" ./node_modules/.bin/next dev --webpack
