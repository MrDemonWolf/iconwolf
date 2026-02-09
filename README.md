# iconwolf - Cross-platform app icon generator

[![GitHub license](https://img.shields.io/github/license/MrDemonWolf/iconwolf)](https://github.com/MrDemonWolf/iconwolf/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/MrDemonWolf/iconwolf)](https://github.com/MrDemonWolf/iconwolf/issues)
[![GitHub stars](https://img.shields.io/github/stars/MrDemonWolf/iconwolf)](https://github.com/MrDemonWolf/iconwolf/stargazers)

A CLI tool that takes an iOS app compositor icon and generates all necessary icon variants for cross-platform use. Built for React Native / Expo projects, iconwolf produces Android adaptive icons (foreground, background, monochrome), web favicons, splash screen icons, and standard icons -- all from a single source image.

## Features

- Generate Android adaptive icon variants (foreground, background, monochrome)
- Generate web favicon
- Generate splash screen icon
- Generate standard icon.png
- Expo convention output paths (drop-in ready for Expo projects)
- Custom output directory support
- Configurable variant selection via CLI flags

## Getting Started

### Install via Homebrew

```bash
brew tap mrdemonwolf/den
brew install iconwolf
```

### Install via npm

```bash
npm install -g iconwolf
```

Or use it directly with npx:

```bash
npx iconwolf <input-icon>
```

### Quick Start

```bash
# Generate all icon variants using Expo conventions
iconwolf icon-compositor.png

# Specify a custom output directory
iconwolf icon-compositor.png --output ./my-icons
```

## Usage

```bash
iconwolf <input> [options]
```

### Arguments

| Argument | Description |
| -------- | ----------- |
| `input`  | Path to the source iOS compositor icon (PNG) |

### Options

| Flag | Description |
| ---- | ----------- |
| `-o, --output <dir>` | Custom output directory (default: `./assets/images/`) |
| `--android` | Generate Android adaptive icon variants only |
| `--favicon` | Generate web favicon only |
| `--splash` | Generate splash screen icon only |
| `--icon` | Generate standard icon.png only |
| `--bg-color <hex>` | Background color for Android adaptive icon (default: `#FFFFFF`) |
| `-h, --help` | Display help |
| `-V, --version` | Display version |

### Examples

```bash
# Generate all variants with Expo convention paths
iconwolf app-icon.png

# Generate only Android adaptive icons
iconwolf app-icon.png --android

# Generate favicon and splash icon to a custom directory
iconwolf app-icon.png --favicon --splash --output ./assets/icons

# Generate only the standard icon
iconwolf app-icon.png --icon
```

## Output Files

| File | Dimensions | Purpose |
|------|-----------|---------|
| `icon.png` | 1024x1024 | Universal app icon (iOS/Android legacy) |
| `android-icon-foreground.png` | 1024x1024 | Android adaptive icon foreground |
| `android-icon-background.png` | 1024x1024 | Android adaptive icon background (solid color) |
| `android-icon-monochrome.png` | 1024x1024 | Android 13+ themed icon (grayscale) |
| `favicon.png` | 48x48 | Web favicon |
| `splash-icon.png` | 1024x1024 | Splash screen icon |

## Tech Stack

- **Node.js** - Runtime
- **Sharp** - High-performance image processing
- **Commander** - CLI framework
- **TypeScript** - Language
- **esbuild** - Bundling for release builds

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/)

### Setup

```bash
# Clone the repository
git clone https://github.com/MrDemonWolf/iconwolf.git
cd iconwolf

# Install dependencies
pnpm install
```

### Scripts

```bash
# Build TypeScript
pnpm run build

# Watch mode
pnpm run dev

# Run tests
pnpm test

# Build release tarball (for Homebrew distribution)
pnpm run build:release

# Lint
pnpm run lint

# Format
pnpm run format
```

### Code Quality

This project uses ESLint for linting and Prettier for code formatting.

## Project Structure

```
iconwolf/
├── src/
│   ├── index.ts            # CLI entry point
│   ├── generator.ts        # Icon generation orchestrator
│   ├── types.ts            # Shared interfaces
│   ├── variants/
│   │   ├── android.ts      # Android adaptive icon variants
│   │   ├── favicon.ts      # Web favicon generation
│   │   ├── splash.ts       # Splash screen icon generation
│   │   └── standard.ts     # Standard icon generation
│   └── utils/
│       ├── image.ts        # Sharp image processing helpers
│       ├── paths.ts        # Expo convention path resolution
│       └── logger.ts       # Console output formatting
├── tests/                  # Vitest test suite
├── scripts/
│   └── build-release.sh    # Release build script
├── Formula/
│   └── iconwolf.rb         # Homebrew formula
├── .github/workflows/      # CI: build binary + update Homebrew tap
├── package.json
├── tsconfig.json
└── README.md
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Have questions or need help? Reach out on Discord.

[![Discord](https://img.shields.io/discord/685086771160064050?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/MrDemonWolf)

---

Made with care by [MrDemonWolf](https://github.com/MrDemonWolf)
