# GEMINI.md - iconwolf Project Context

This document provides foundational mandates and context for the `iconwolf` project, a cross-platform app icon generator for Expo and React Native projects.

## Project Overview

`iconwolf` is a monorepo containing a core CLI/library, an MCP server for AI integration, and a self-hostable web GUI. It specializes in transforming Apple Icon Composer `.icon` folders or plain PNGs into a complete set of application icons, including Android adaptive icons, web favicons, and splash screens.

### Architecture & Tech Stack

- **Monorepo Manager:** Bun (workspaces) + Turborepo
- **Runtime:** Node.js (>=18)
- **Language:** TypeScript (strict, ESM)
- **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/)
- **Testing:** [Vitest](https://vitest.dev/)
- **Linting/Formatting:** ESLint v9 (flat config), Prettier
- **Key Packages:**
  - `packages/iconwolf`: Core CLI (`commander`) and library logic.
  - `packages/iconwolf-mcp`: Model Context Protocol server for AI integration.
  - `apps/web`: Web GUI (Hono server + React 19 frontend).

## Directory Structure

- `apps/web/`: Self-hostable web interface (Hono + React + Vite).
- `packages/iconwolf/`: Core logic and CLI tool.
  - `src/generator.ts`: Main orchestration logic.
  - `src/utils/icon-composer.ts`: Apple `.icon` folder parser.
  - `src/variants/`: Specific logic for Android, favicon, splash, and standard icons.
- `packages/iconwolf-mcp/`: MCP server implementation and tools.
- `Formula/`: Homebrew formula for distribution.
- `.github/workflows/`: CI/CD pipelines for testing, building, and publishing.

## Building and Running

All primary commands should be executed from the root using Bun and Turborepo.

### Root Commands
- **Install Dependencies:** `bun install`
- **Build All:** `bun run build`
- **Run Tests:** `bun run test`
- **Lint All:** `bun run lint`
- **Format Code:** `bun run format`
- **Dev Mode:** `bun run dev`

### Package-Specific Commands
- **CLI Dev:** `cd packages/iconwolf && bun run dev`
- **Web App Start:** `cd apps/web && bun run dev` (Vite on port 5173, Hono on 3001)
- **Build Release:** `cd packages/iconwolf && bun run build:release`

## Development Conventions

### Coding Style
- **TypeScript:** Use strict typing and ESM modules (`"type": "module"`).
- **Asynchronous Code:** Prefer `async/await` over raw promises.
- **Image Processing:** All image manipulations must go through the `sharp` library.
- **CLI Output:** Use `chalk` for colorized console output and the internal `logger.ts` for consistency.

### Testing Practices
- **Framework:** Vitest.
- **Location:** Tests are located in the `tests/` directory within each package.
- **Verification:** Always run `bun run test` before submitting changes to ensure no regressions in icon generation logic.

### Deployment & Distribution
- **CLI:** Distributed via npm and Homebrew.
- **Web:** Deployable via Docker (Dockerfile in `apps/web/`) or Coolify.
- **MCP:** Can be added to AI clients using `npx @mrdemonwolf/iconwolf-mcp`.

## Contextual Mandates
- **Performance:** Icon generation must be fast; avoid unnecessary file I/O or heavy computations during the generation loop.
- **Silent Mode:** Ensure the `silent` flag in `GeneratorOptions` is respected in library usage (MCP and Web) to prevent console pollution.
- **Compatibility:** Maintain exact compatibility with `expo-template-default` output paths and naming conventions.
