# iconwolf

Cross-platform app icon generator CLI for Expo/React Native projects. Primary input format is Apple Icon Composer `.icon` folders; also accepts plain PNG files.

## Tech Stack

- **Runtime**: Node.js (>=18), ESM (`"type": "module"`)
- **Language**: TypeScript (strict, ES2022, NodeNext module resolution)
- **Image processing**: Sharp
- **CLI framework**: Commander
- **Console output**: Chalk
- **Testing**: Vitest
- **Linting**: ESLint v9 (flat config with typescript-eslint)
- **Formatting**: Prettier
- **Bundling**: esbuild (CJS bundle for release tarballs)
- **Package manager**: pnpm

## Project Structure

```
src/
  index.ts          # CLI entry point (Commander setup, #!/usr/bin/env node)
  generator.ts      # Orchestrator: detects .icon vs PNG, dispatches to variant generators
  types.ts          # Shared interfaces (VariantFlags, GeneratorOptions, GenerationResult)
  utils/
    icon-composer.ts # Apple Icon Composer .icon folder parser and renderer
    image.ts        # Sharp operations (resize, adaptive foreground, solid bg, monochrome, rounded corners, hex parsing)
    paths.ts        # Output file name constants, resolveOutputPath(), resolveDefaultOutputDir()
    logger.ts       # Chalk-based console output (banner, info, success, warn, error, summary, updateNotice)
    update-notifier.ts # Non-blocking update checker (GitHub Releases API, 24h cached TTL, sync read + background fetch)
  variants/
    standard.ts     # icon.png (1024x1024)
    favicon.ts      # favicon.png (48x48, rounded corners, opt-in only via --favicon)
    splash.ts       # splash-icon.png (1024x1024)
    android.ts      # android-icon-{foreground,background,monochrome}.png (1024x1024)
tests/
  helpers.ts        # Test utilities (createTestPng, createTmpDir, cleanDir)
  cli.test.ts       # CLI end-to-end tests (--version, --help, flags, error handling)
  generator.test.ts # Integration tests for the orchestrator (including .icon folder input)
  utils/            # Unit tests for image.ts, paths.ts, icon-composer.ts, logger.ts, and update-notifier.ts
  variants/         # Unit tests for each variant generator
Formula/
  iconwolf.rb       # Homebrew formula (update sha256 + url on release)
eslint.config.js    # ESLint v9 flat config with typescript-eslint
CHANGELOG.md        # Release changelog (all versions)
.github/workflows/
  test.yml          # CI: lint (ubuntu) + test matrix (Node 18/20/22 × ubuntu/macOS 14) on push to main and PRs
  build-binary.yml  # CI: builds release tarball on GitHub release
  update-homebrew.yml # CI: updates homebrew-den tap formula after build
```

## Commands

- `pnpm run build` - Compile TypeScript to `dist/`
- `pnpm run build:release` - Build release tarball to `dist-bin/` (esbuild bundle + sharp native bindings)
- `pnpm run dev` - Watch mode compilation
- `pnpm test` - Run all tests with Vitest (87 tests across 11 files)
- `pnpm run lint` - ESLint (src/ and tests/)
- `pnpm run format` - Prettier (write mode, src/ and tests/)
- `pnpm run format:check` - Prettier (check mode, src/ and tests/, used in CI)

## Key Architecture Notes

- **Apple Icon Composer support**: `.icon` folders are the primary input. The `icon-composer.ts` module reads `icon.json`, renders gradient/solid backgrounds via SVG, composites foreground layers with scale and translation, and outputs a 1024x1024 composed PNG. Background color is auto-extracted for Android adaptive icons.
- All variant generators return `GenerationResult` with file path, dimensions, and size in bytes.
- Android adaptive icons use the 66/108 safe zone ratio (626px in 1024px canvas, 199px margin).
- When no variant flags are set, the generator produces 5 output files (icon, android x3, splash). Favicon is opt-in only via `--favicon`.
- Favicon has Apple-style rounded corners (~22.37% corner radius).
- Default output directory is auto-detected: `./src/assets/images/` if a `src/` directory exists, otherwise `./assets/images/` (Expo convention).
- Homebrew distributes pre-built tarballs (esbuild bundle + sharp native bindings, no compilation on install). The `Build Binary` GitHub Action builds on macOS arm64 on every release. The `Update Homebrew Tap` action then updates the formula in `homebrew-den` with the correct sha256 hash. Requires `HOMEBREW_TAP_TOKEN` secret.
- **Update notifier**: On each `generate()` run, reads a cached version check from `~/.iconwolf/update-check.json` (sync, zero latency). Fires a background fetch to GitHub Releases API if the cache is stale (>24h). Shows a notice after successful generation if a newer version exists. All errors are silently swallowed.
- Releasing: bump version in `package.json` + `src/index.ts` (the `VERSION` constant) + `Formula/iconwolf.rb`, update `CHANGELOG.md`, push, create a GitHub release. CI handles building and updating the tap.
- Local release build: `bash scripts/build-release.sh macos-arm64` then `gh release upload <tag> dist-bin/iconwolf-macos-arm64.tar.gz`
