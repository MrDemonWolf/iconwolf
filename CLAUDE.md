# iconwolf

Cross-platform app icon generator CLI for Expo/React Native projects. Primary input format is Apple Icon Composer `.icon` folders; also accepts plain PNG files. Includes an MCP server for AI-driven icon generation.

## Tech Stack

- **Runtime**: Node.js (>=18), ESM (`"type": "module"`)
- **Language**: TypeScript (strict, ES2022, NodeNext module resolution)
- **Image processing**: Sharp
- **CLI framework**: Commander
- **Console output**: Chalk
- **MCP server**: @modelcontextprotocol/sdk, Zod
- **Testing**: Vitest
- **Linting**: ESLint v9 (flat config with typescript-eslint)
- **Formatting**: Prettier
- **Bundling**: esbuild (CJS bundle for release tarballs)
- **Package manager**: pnpm (monorepo with pnpm workspaces)

## Project Structure

```
pnpm-workspace.yaml   # Declares packages/*
package.json          # Root: private, workspace scripts (pnpm -r run build/test/lint)
.prettierrc           # Shared Prettier config
CHANGELOG.md          # Release changelog (all versions)
Formula/
  iconwolf.rb         # Homebrew formula (update sha256 + url on release)
.github/workflows/
  test.yml            # CI: lint (ubuntu) + test matrix (Node 18/20/22 × ubuntu/macOS 14)
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
```

## Commands

All commands run from the monorepo root:

- `pnpm run build` - Build all packages (`pnpm -r run build`)
- `pnpm run test` - Run all tests (`pnpm -r run test`)
- `pnpm run lint` - Lint all packages
- `pnpm run format` - Format all packages
- `pnpm run format:check` - Check formatting (used in CI)

Package-specific (from `packages/iconwolf/`):
- `pnpm run build:release` - Build release tarball to `dist-bin/`
- `pnpm run dev` - Watch mode compilation

## Key Architecture Notes

- **Monorepo**: pnpm workspaces with two packages. `iconwolf` is the core CLI, `@mrdemonwolf/iconwolf-mcp` is the MCP server that depends on `iconwolf` via `workspace:*`.
- **Library exports**: `packages/iconwolf/src/lib.ts` re-exports the public API. The `exports` field in package.json maps `"."` → `./dist/lib.js` (library) and `"./cli"` → `./dist/index.js` (CLI).
- **Silent mode**: `GeneratorOptions.silent` suppresses all console output when used programmatically (e.g., by the MCP server).
- **Apple Icon Composer support**: `.icon` folders are the primary input. The `icon-composer.ts` module reads `icon.json`, renders gradient/solid backgrounds via SVG, composites foreground layers with scale and translation, and outputs a 1024x1024 composed PNG. Background color is auto-extracted for Android adaptive icons.
- All variant generators return `GenerationResult` with file path, dimensions, and size in bytes. The `generate()` function returns `Promise<GenerationResult[]>`.
- Android adaptive icons use the 66/108 safe zone ratio (626px in 1024px canvas, 199px margin).
- When no variant flags are set, the generator produces 4 output files matching `expo-template-default`: icon.png, adaptive-icon.png, splash-icon.png, favicon.png. The `--android` flag adds background and monochrome variants.
- `--splash-input <path>` allows using a separate image (PNG or .icon folder) for the splash screen icon.
- Favicon has Apple-style rounded corners (~22.37% corner radius).
- Default output directory is auto-detected: `./src/assets/images/` if a `src/` directory exists, otherwise `./assets/images/` (Expo convention).
- **MCP server**: Exposes 5 tools (`generate_icons`, `generate_icon`, `generate_favicon`, `generate_splash`, `generate_android_icons`). Accepts `file_path` or `base64_image` input. Returns MCP responses with text (JSON metadata) and image (base64 PNG) content blocks.
- **MCP client config**: `"command": "npx", "args": ["@mrdemonwolf/iconwolf-mcp"]`
- Homebrew distributes pre-built tarballs (esbuild bundle + sharp native bindings, no compilation on install). The `Build Binary` GitHub Action builds on macOS arm64 on every release. The `Update Homebrew Tap` action then updates the formula in `homebrew-den` with the correct sha256 hash. Requires `HOMEBREW_TAP_TOKEN` secret.
- **npm publishing**: The `publish.yml` workflow publishes both packages to npm on GitHub release. Requires `NPM_TOKEN` secret.
- **Update notifier**: On each `generate()` run, reads a cached version check from `~/.iconwolf/update-check.json` (sync, zero latency). Fires a background fetch to GitHub Releases API if the cache is stale (>24h). Shows a notice after successful generation if a newer version exists. All errors are silently swallowed.
- Releasing: bump version in `package.json` (both packages) + `src/index.ts` (the `VERSION` constant) + `Formula/iconwolf.rb`, update `CHANGELOG.md`, push, create a GitHub release. CI handles building, updating the tap, and publishing to npm.
- Local release build: `cd packages/iconwolf && bash scripts/build-release.sh macos-arm64` then `gh release upload <tag> dist-bin/iconwolf-macos-arm64.tar.gz`
