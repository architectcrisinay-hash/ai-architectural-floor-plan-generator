#!/usr/bin/env bash
#
# Build dist/VillaPlanner.exe — a single self-contained Windows executable
# containing the Next.js app, a Node runtime, and a native launcher.
#
# Requirements:
#   - Linux x86_64 (cross-compiles to Windows; Wine is NOT needed)
#   - node/npm, curl, unzip, zip, python3
#   - Go: if `go` is not on PATH, it is downloaded to .toolchain/go
#
# Usage:
#   bash scripts/build-exe.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NODE_VERSION="${NODE_VERSION:-22.23.2}"
GO_VERSION="${GO_VERSION:-1.23.4}"
APP_NAME="AIVillaPlanner"

TOOLCHAIN="$ROOT/.toolchain"
GO_DIR="$TOOLCHAIN/go"
ASSETS="$ROOT/build-win/go/assets"
STAGE="$ROOT/build-win/stage"
DIST="$ROOT/dist"
DL="$TOOLCHAIN/downloads"

log() { printf '\n==> %s\n' "$*"; }

# ---------------------------------------------------------------- Go toolchain
if command -v go >/dev/null 2>&1; then
  GO_BIN="$(command -v go)"
elif [ -x "$GO_DIR/bin/go" ]; then
  GO_BIN="$GO_DIR/bin/go"
else
  log "Downloading Go $GO_VERSION"
  mkdir -p "$DL"
  curl -fsSL -o "$DL/go.tar.gz" "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
  mkdir -p "$TOOLCHAIN"
  tar -xzf "$DL/go.tar.gz" -C "$TOOLCHAIN"
  GO_BIN="$GO_DIR/bin/go"
fi
"$GO_BIN" version

# Keep the build cache off tmpfs (often only ~500MB and easy to exhaust).
export GOCACHE="$TOOLCHAIN/cache"
export GOTMPDIR="$TOOLCHAIN/tmp"
export GOFLAGS="-mod=mod"
mkdir -p "$GOCACHE" "$GOTMPDIR"

# ------------------------------------------------------------- Next.js bundle
log "Building Next.js standalone bundle"
npm run build

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: .next/standalone/server.js missing — is output:'standalone' set in next.config.js?" >&2
  exit 1
fi

# ------------------------------------------------------------------- staging
log "Staging application files"
rm -rf "$STAGE"
mkdir -p "$STAGE/app"
cp -r .next/standalone/. "$STAGE/app/"

# Strip Linux-only native modules. They are traced into the bundle by Next's
# file tracing but cannot load on Windows. The app uses no next/image, so
# sharp is not needed at runtime.
rm -rf "$STAGE/app/node_modules/@img" "$STAGE/app/node_modules/sharp"

# Next.js does not copy static assets into standalone; they must be added.
cp -r .next/static "$STAGE/app/.next/static"

leftover="$(find "$STAGE/app" \( -name '*.node' -o -name '*.so*' \) 2>/dev/null || true)"
if [ -n "$leftover" ]; then
  echo "ERROR: platform-specific binaries remain in the bundle:" >&2
  echo "$leftover" >&2
  exit 1
fi

# -------------------------------------------------------------------- assets
log "Packaging embedded assets"
mkdir -p "$ASSETS"
( cd "$STAGE/app" && zip -q -r -X "$ASSETS/app.zip" . )
unzip -t "$ASSETS/app.zip" >/dev/null

if [ ! -f "$ASSETS/node.exe" ]; then
  log "Downloading Node $NODE_VERSION for Windows"
  mkdir -p "$DL"
  curl -fsSL -o "$DL/node-win.zip" \
    "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
  unzip -o -q -j "$DL/node-win.zip" "node-v${NODE_VERSION}-win-x64/node.exe" -d "$ASSETS"
fi

# ---------------------------------------------------------------------- build
log "Cross-compiling Windows executable"
STAMP="$(tr -d '\n' < .next/BUILD_ID | tr -cd 'A-Za-z0-9_-')"
mkdir -p "$DIST"

( cd build-win/go && \
  GOOS=windows GOARCH=amd64 CGO_ENABLED=0 \
  "$GO_BIN" build -trimpath \
    -ldflags "-s -w -X main.buildStamp=$STAMP" \
    -o "$DIST/VillaPlanner.exe" . )

log "Done"
ls -lh "$DIST/VillaPlanner.exe"
file "$DIST/VillaPlanner.exe" 2>/dev/null || true
