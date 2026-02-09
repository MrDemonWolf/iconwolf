# iconwolf - Cross-platform app icon generator for Expo/React Native

A CLI tool that takes an Apple Icon Composer `.icon` folder
(or a plain PNG) and generates all necessary icon variants for
cross-platform use. Built for React Native and Expo projects,
iconwolf produces Android adaptive icons, web favicons, splash
screen icons, and standard app icons -- all from one source.

One icon to rule them all.

## Features

- **Apple Icon Composer Support** - First-class support for
  `.icon` folders from [Apple's Icon Composer](https://developer.apple.com/icon-composer/).
  Renders gradient backgrounds, layers, and positioning automatically.
- **Android Adaptive Icons** - Generates foreground, background,
  and monochrome variants using the 66/108 safe zone ratio.
- **Web Favicon** - Produces a 48x48 favicon ready for the web.
- **Splash Screen Icon** - Creates a 1024x1024 splash icon.
- **Standard App Icon** - Outputs a universal 1024x1024 icon.
- **Expo Drop-in Ready** - Defaults to `./assets/images/` to
  match Expo project conventions out of the box.
- **Auto Background Color** - When using `.icon` input, the
  background gradient color is automatically extracted for Android
  adaptive icons.
- **Selective Generation** - Use CLI flags to generate only the
  variants you need.
- **Custom Background Color** - Override the Android adaptive
  icon background color via `--bg-color`.

## Getting Started

1. Design your icon in [Apple Icon Composer](https://developer.apple.com/icon-composer/).
2. Install iconwolf via Homebrew or npm (see below).
3. Run `iconwolf AppIcon.icon` in your project directory.
4. All icon variants land in `./assets/images/` by default.

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

## Usage

```bash
iconwolf <input> [options]
```

### Arguments

| Argument | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| `input`  | Path to an Apple Icon Composer `.icon` folder or a source PNG file |

### Options

| Flag                 | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `-o, --output <dir>` | Custom output directory (default: `./assets/images/`)            |
| `--android`          | Generate Android adaptive icon variants only                     |
| `--favicon`          | Generate web favicon only                                        |
| `--splash`           | Generate splash screen icon only                                 |
| `--icon`             | Generate standard icon.png only                                  |
| `--bg-color <hex>`   | Background color for Android adaptive icon (default: `#FFFFFF`)  |
| `-h, --help`         | Display help                                                     |
| `-V, --version`      | Display version                                                  |

### Examples

```bash
# Generate all variants from an Apple Icon Composer file
iconwolf AppIcon.icon

# Generate all variants from a plain PNG
iconwolf app-icon.png

# Generate only Android adaptive icons
iconwolf AppIcon.icon --android

# Generate favicon and splash icon to a custom directory
iconwolf AppIcon.icon --favicon --splash --output ./assets/icons

# Generate only the standard icon
iconwolf AppIcon.icon --icon

# Override the Android adaptive icon background color
iconwolf AppIcon.icon --android --bg-color "#1A1A2E"
```

### Output Files

| File                           | Dimensions | Purpose                                     |
| ------------------------------ | ---------- | ------------------------------------------- |
| `icon.png`                     | 1024x1024  | Universal app icon (iOS/Android legacy)      |
| `android-icon-foreground.png`  | 1024x1024  | Android adaptive icon foreground             |
| `android-icon-background.png`  | 1024x1024  | Android adaptive icon background (solid)     |
| `android-icon-monochrome.png`  | 1024x1024  | Android 13+ themed icon (grayscale)          |
| `favicon.png`                  | 48x48      | Web favicon                                  |
| `splash-icon.png`              | 1024x1024  | Splash screen icon                           |

## Tech Stack

| Layer            | Technology  |
| ---------------- | ----------- |
| Runtime          | Node.js     |
| Language         | TypeScript  |
| Image Processing | Sharp       |
| CLI Framework    | Commander   |
| Console Output   | Chalk       |
| Testing          | Vitest      |
| Bundling         | esbuild     |
| Package Manager  | pnpm        |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/MrDemonWolf/iconwolf.git
cd iconwolf
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm run build
```

### Development Scripts

- `pnpm run build` - Compile TypeScript to `dist/`
- `pnpm run build:release` - Build release tarball to `dist-bin/`
  (esbuild bundle + sharp native bindings)
- `pnpm run dev` - Watch mode compilation
- `pnpm test` - Run all tests with Vitest
- `pnpm run lint` - Run ESLint across `src/`
- `pnpm run format` - Format code with Prettier

### Code Quality

- ESLint with TypeScript rules for static analysis
- Prettier for consistent code formatting
- Vitest for unit and integration tests
- Strict TypeScript configuration (ES2022, NodeNext)

## Project Structure

```
iconwolf/
├── src/
│   ├── index.ts            # CLI entry point (Commander setup)
│   ├── generator.ts        # Icon generation orchestrator
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── variants/
│   │   ├── android.ts      # Android adaptive icon variants
│   │   ├── favicon.ts      # Web favicon generation
│   │   ├── splash.ts       # Splash screen icon generation
│   │   └── standard.ts     # Standard icon generation
│   └── utils/
│       ├── icon-composer.ts # Apple Icon Composer .icon parser
│       ├── image.ts        # Sharp image processing helpers
│       ├── paths.ts        # Output path resolution
│       └── logger.ts       # Console output formatting
├── tests/                  # Vitest test suite
├── scripts/
│   └── build-release.sh    # Release build script
├── Formula/
│   └── iconwolf.rb         # Homebrew formula
├── .github/workflows/      # CI: tests, build binary, update Homebrew tap
├── package.json
├── tsconfig.json
└── README.md
```

## License

![GitHub license](https://img.shields.io/github/license/mrdemonwolf/iconwolf.svg?style=for-the-badge&logo=github)

This project is licensed under the MIT License. See the
[LICENSE](LICENSE) file for details.

## Contact

Have questions or feedback?

- Discord: [Join my server](https://mrdwolf.net/discord)

---

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
