# iconwolf

Cross-platform app icon generator CLI for Expo/React Native projects.

## Tech Stack

- **Runtime**: Node.js (>=18), ESM (`"type": "module"`)
- **Language**: TypeScript (strict, ES2022, NodeNext module resolution)
- **Image processing**: Sharp
- **CLI framework**: Commander
- **Console output**: Chalk
- **Testing**: Vitest
- **Package manager**: pnpm

## Project Structure

```
src/
  index.ts          # CLI entry point (Commander setup, #!/usr/bin/env node)
  generator.ts      # Orchestrator: validates input, dispatches to variant generators
  types.ts          # Shared interfaces (VariantFlags, GeneratorOptions, GenerationResult)
  utils/
    image.ts        # Sharp operations (resize, adaptive foreground, solid bg, monochrome, hex parsing)
    paths.ts        # Output file name constants, resolveOutputPath(), DEFAULT_OUTPUT_DIR
    logger.ts       # Chalk-based console output (banner, info, success, warn, error, summary)
  variants/
    standard.ts     # icon.png (1024x1024)
    favicon.ts      # favicon.png (48x48)
    splash.ts       # splash-icon.png (1024x1024)
    android.ts      # android-icon-{foreground,background,monochrome}.png (1024x1024)
tests/
  helpers.ts        # Test utilities (createTestPng, createTmpDir, cleanDir)
  generator.test.ts # Integration tests for the orchestrator
  utils/            # Unit tests for image.ts and paths.ts
  variants/         # Unit tests for each variant generator
Formula/
  iconwolf.rb       # Homebrew formula (update sha256 + url on release)
```

## Commands

- `pnpm run build` - Compile TypeScript to `dist/`
- `pnpm run dev` - Watch mode compilation
- `pnpm test` - Run all tests with Vitest
- `pnpm run lint` - ESLint
- `pnpm run format` - Prettier

## Key Architecture Notes

- All variant generators return `GenerationResult` with file path, dimensions, and size in bytes.
- Android adaptive icons use the 66/108 safe zone ratio (626px in 1024px canvas, 199px margin).
- When no variant flags are set, the generator produces all 6 output files.
- Default output directory is `./assets/images/` (Expo convention).
- The Homebrew formula in `Formula/iconwolf.rb` needs the `sha256` and `url` updated for each tagged release before copying to the tap repo.
