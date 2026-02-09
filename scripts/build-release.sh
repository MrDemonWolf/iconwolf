#!/bin/bash
set -euo pipefail

PLATFORM="${1:-macos-arm64}"
VERSION=$(node -p "require('./package.json').version")
STAGING="dist-bin/iconwolf"

echo "Building iconwolf v${VERSION} for ${PLATFORM}"

# Clean
rm -rf dist-bin
mkdir -p "$STAGING/lib"

# Step 1: Compile TypeScript
echo "  Compiling TypeScript..."
pnpm run build

# Step 2: Bundle into single CJS file (sharp stays external)
echo "  Bundling with esbuild..."
pnpm exec esbuild dist/index.js \
  --bundle \
  --platform=node \
  --format=cjs \
  --external:sharp \
  --outfile="$STAGING/lib/bundle.cjs"

# Step 3: Install sharp with all deps into staging (production, self-contained)
echo "  Installing sharp into staging..."
cd "$STAGING/lib"
cat > package.json << EOF
{"private":true,"dependencies":{"sharp":"$(node -p "require('../../package.json').dependencies.sharp")"}}
EOF
npm install --omit=dev 2>&1 | tail -1
rm -f package.json package-lock.json
cd - > /dev/null

# Step 4: Create CLI wrapper
echo "  Creating CLI wrapper..."
mkdir -p "$STAGING/bin"
cat > "$STAGING/bin/iconwolf" << 'WRAPPER'
#!/bin/bash
# Resolve symlinks (Homebrew symlinks from /opt/homebrew/bin/ to libexec/)
SOURCE="$0"
while [ -L "$SOURCE" ]; do
  LINK_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ "$SOURCE" != /* ]] && SOURCE="$LINK_DIR/$SOURCE"
done
DIR="$(cd "$(dirname "$SOURCE")/.." && pwd)"
NODE_PATH="$DIR/lib/node_modules" exec node "$DIR/lib/bundle.cjs" "$@"
WRAPPER
chmod +x "$STAGING/bin/iconwolf"

# Step 5: Create tarball
ARCHIVE="dist-bin/iconwolf-${PLATFORM}.tar.gz"
echo "  Creating archive..."
tar -czf "$ARCHIVE" -C dist-bin iconwolf/

# Show result
SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo ""
echo "Done! ${ARCHIVE} (${SIZE})"
