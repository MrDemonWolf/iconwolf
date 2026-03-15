# iconwolf

Cross-platform app icon generator CLI for Expo/React Native projects. Primary input format is Apple Icon Composer `.icon` folders; also accepts plain PNG files. Includes an MCP server for AI-driven icon generation and a self-hostable web GUI.

## Tech Stack

- **Runtime**: Node.js (>=18), ESM (`"type": "module"`)
- **Language**: TypeScript (strict, ES2022, NodeNext module resolution)
- **Image processing**: Sharp
- **CLI framework**: Commander
- **Console output**: Chalk
- **MCP server**: @modelcontextprotocol/sdk, Zod
- **Web server**: Hono + @hono/node-server
- **Web frontend**: React 19, Tailwind CSS v3, Vite
- **Testing**: Vitest
- **Linting**: ESLint v9 (flat config with typescript-eslint)
- **Formatting**: Prettier
- **Bundling**: esbuild (CJS bundle for release tarballs)
- **Package manager**: Bun (monorepo with Bun workspaces)
- **Task runner**: Turborepo

## Project Structure

```
turbo.json            # Turborepo task definitions
package.json          # Root: private, workspace scripts (turbo build/test/lint)
bun.lock              # Bun lockfile
.prettierrc           # Shared Prettier config
CHANGELOG.md          # Release changelog (all versions)
docker-compose.yml    # Local Docker testing
.dockerignore         # Docker build exclusions
Formula/
  iconwolf.rb         # Homebrew formula (update sha256 + url on release)
.github/workflows/
  test.yml            # CI: lint (ubuntu) + test matrix (Node 22 × ubuntu/macOS 14)
  build-binary.yml    # CI: builds release tarball on GitHub release
  update-homebrew.yml # CI: updates homebrew-den tap formula after build
  publish.yml         # CI: publishes both packages to npm on GitHub release

packages/iconwolf/          # Core CLI package
  src/
    index.ts                # CLI entry point (Commander setup, #!/usr/bin/env node)
    lib.ts                  # Library entry: re-exports public API for programmatic use
    generator.ts            # Orchestrator: detects .icon vs PNG, dispatches to variant generators
    types.ts                # Shared interfaces (VariantFlags, GeneratorOptions, GenerationResult)
    utils/
      banner.ts             # Diagonal ribbon banner SVG generation and compositing
      icon-composer.ts      # Apple Icon Composer .icon folder parser and renderer
      image.ts              # Sharp operations (resize, adaptive foreground, solid bg, monochrome, rounded corners, hex parsing)
      paths.ts              # Output file name constants, resolveOutputPath(), resolveDefaultOutputDir()
      logger.ts             # Chalk-based console output (banner, info, success, warn, error, summary, updateNotice)
      update-notifier.ts    # Non-blocking update checker (GitHub Releases API, 24h cached TTL)
    variants/
      standard.ts           # icon.png (1024x1024)
      favicon.ts            # favicon.png (48x48, rounded corners)
      splash.ts             # splash-icon.png (1024x1024)
      android.ts            # adaptive-icon.png + optional background/monochrome
  tests/                    # 90 tests across 11 files
  scripts/
    build-release.sh        # Build release tarball for Homebrew distribution

packages/iconwolf-mcp/      # MCP server package (@mrdemonwolf/iconwolf-mcp)
  src/
    index.ts                # Server entry (stdio transport, 5 tools registered)
    tools/
      generate-icons.ts     # All variants from one input (mirrors CLI default)
      generate-icon.ts      # 1024x1024 icon.png
      generate-favicon.ts   # 48x48 favicon.png
      generate-splash.ts    # 1024x1024 splash-icon.png
      generate-android.ts   # Android adaptive icon variants
    utils/
      io.ts                 # Base64 ↔ file, temp dir management
      schemas.ts            # Zod input schemas for MCP tools
  tests/                    # 15 tests across 6 files

apps/web/                   # Self-hostable web GUI (private, not published to npm)
  Dockerfile              # Multi-stage: Bun deps/build → Node 22 slim runtime
  index.html              # Vite entry point
  vite.config.ts          # Vite config with React plugin, /api proxy
  tailwind.config.ts      # Tailwind CSS with shadcn/ui CSS variables
  src/
    server/
      index.ts            # Hono app — serves API + static frontend
      routes/
        generate.ts       # POST /api/generate — full icon generation
        preview.ts        # POST /api/preview — quick single-icon preview
        download.ts       # GET /api/download/:sessionId — ZIP download
        health.ts         # GET /api/health — Coolify health check
      utils/
        temp.ts           # Temp dir + cleanup
        sessions.ts       # In-memory session store (5min TTL)
        icon-extract.ts   # Extract .icon folder from uploaded ZIP
    client/
      main.tsx            # React entry point
      App.tsx             # Main app component
      styles/globals.css  # Tailwind + blue theme CSS variables
      lib/
        api.ts            # Fetch wrapper for API endpoints
        utils.ts          # cn() utility
      hooks/
        useGenerate.ts    # Generation state management
        useTheme.ts       # Light/dark theme toggle
      components/
        layout/
          Header.tsx      # Logo, theme toggle
          Footer.tsx
        icons/
          UploadZone.tsx  # Drag-and-drop PNG or .icon ZIP upload
          SplashUpload.tsx # Optional separate splash image
          VariantConfig.tsx # Icon/Android/Favicon/Splash checkboxes
          ColorPicker.tsx  # bgColor + darkBgColor
          BannerConfig.tsx # Text, color, position
          PreviewGrid.tsx  # Generated icon grid with modal
          DownloadBar.tsx  # ZIP download + individual downloads
```

## Commands

All commands run from the monorepo root:

- `bun run build` - Build all packages (via Turborepo)
- `bun run test` - Run all tests
- `bun run dev` - Dev mode (all packages)
- `bun run lint` - Lint all packages
- `bun run format` - Format all packages
- `bun run format:check` - Check formatting (used in CI)

Package-specific (from `packages/iconwolf/`):
- `bun run build:release` - Build release tarball to `dist-bin/`
- `bun run dev` - Watch mode compilation

Web app (from `apps/web/`):
- `bun run dev` - Start Vite dev server + Hono server (ports 5173 + 3001)
- `bun run build` - Build client + server for production
- `bun run start` - Start production server (port 3000)

Docker:
- `docker compose up --build` - Build and run web app locally on port 3000

## Key Architecture Notes

- **Monorepo**: Bun workspaces with `packages/*` and `apps/*`. Turborepo orchestrates builds with dependency-aware task execution. `iconwolf` is the core CLI, `@mrdemonwolf/iconwolf-mcp` is the MCP server, and `@mrdemonwolf/iconwolf-web` is the self-hostable web GUI.
- **Library exports**: `packages/iconwolf/src/lib.ts` re-exports the public API. The `exports` field in package.json maps `"."` → `./dist/lib.js` (library) and `"./cli"` → `./dist/index.js` (CLI).
- **Silent mode**: `GeneratorOptions.silent` suppresses all console output when used programmatically (e.g., by the MCP server and web app).
- **Apple Icon Composer support**: `.icon` folders are the primary input. The `icon-composer.ts` module reads `icon.json`, renders gradient/solid backgrounds via SVG, composites foreground layers with scale and translation, and outputs a 1024x1024 composed PNG. Background color is auto-extracted for Android adaptive icons.
- All variant generators return `GenerationResult` with file path, dimensions, and size in bytes. The `generate()` function returns `Promise<GenerationResult[]>`.
- Android adaptive icons use the 66/108 safe zone ratio (626px in 1024px canvas, 199px margin).
- When no variant flags are set, the generator produces 4 output files matching `expo-template-default`: icon.png, adaptive-icon.png, splash-icon.png, favicon.png. The `--android` flag adds background and monochrome variants.
- `--splash-input <path>` allows using a separate image (PNG or .icon folder) for the splash screen icon.
- Favicon has Apple-style rounded corners (~22.37% corner radius).
- Default output directory is auto-detected: `./src/assets/images/` if a `src/` directory exists, otherwise `./assets/images/` (Expo convention).
- **MCP server**: Exposes 5 tools (`generate_icons`, `generate_icon`, `generate_favicon`, `generate_splash`, `generate_android_icons`). Accepts `file_path` or `base64_image` input. Returns MCP responses with text (JSON metadata) and image (base64 PNG) content blocks.
- **MCP client config**: `"command": "npx", "args": ["@mrdemonwolf/iconwolf-mcp"]`
- **Web GUI**: Self-hostable via Docker/Coolify. Hono server handles API routes + serves Vite-built static frontend. Accepts PNG files and .icon ZIP uploads. In-memory session store with 5-minute TTL for generated results. Health check at `GET /api/health`.
- Homebrew distributes pre-built tarballs (esbuild bundle + sharp native bindings, no compilation on install). The `Build Binary` GitHub Action builds on macOS arm64 on every release. The `Update Homebrew Tap` action then updates the formula in `homebrew-den` with the correct sha256 hash. Requires `HOMEBREW_TAP_TOKEN` secret.
- **npm publishing**: The `publish.yml` workflow publishes both packages to npm on GitHub release. Requires `NPM_TOKEN` secret.
- **Update notifier**: On each `generate()` run, reads a cached version check from `~/.iconwolf/update-check.json` (sync, zero latency). Fires a background fetch to GitHub Releases API if the cache is stale (>24h). Shows a notice after successful generation if a newer version exists. All errors are silently swallowed.
- Releasing: bump version in `package.json` (both packages) + `src/index.ts` (the `VERSION` constant) + `Formula/iconwolf.rb`, update `CHANGELOG.md`, push, create a GitHub release. CI handles building, updating the tap, and publishing to npm.
- Local release build: `cd packages/iconwolf && bash scripts/build-release.sh macos-arm64` then `gh release upload <tag> dist-bin/iconwolf-macos-arm64.tar.gz`
- **Coolify deployment**: Point to repo, set Dockerfile path to `apps/web/Dockerfile`, expose port 3000, health check `GET /api/health`.
