#!/usr/bin/env bash
set -e
cd /opt/platform/src/app/apps/api
rm -rf dist
rm -f tsconfig.build.tsbuildinfo
./node_modules/.bin/tsc -p tsconfig.build.json
exec node dist/main.js
