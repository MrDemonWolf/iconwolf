# @mrdemonwolf/iconwolf-mcp

MCP (Model Context Protocol) server for AI-driven app icon generation using [iconwolf](https://github.com/MrDemonWolf/iconwolf).

This lets AI assistants like Claude generate app icons, favicons, splash screens, and Android adaptive icons directly through conversation.

## Quick Setup

### Claude Code

```bash
claude mcp add --scope user --transport stdio iconwolf -- npx @mrdemonwolf/iconwolf-mcp
```

Then restart Claude Code.

### Manual Configuration

Add to your MCP client settings:

```json
{
  "mcpServers": {
    "iconwolf": {
      "command": "npx",
      "args": ["@mrdemonwolf/iconwolf-mcp"]
    }
  }
}
```

**Claude Code** — Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (per-project)

**Claude Desktop** — Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

## Available Tools

| Tool | Description | Output |
|------|-------------|--------|
| `generate_icons` | Generate all icon variants from one source image | icon.png, adaptive-icon.png, splash-icon.png, favicon.png |
| `generate_icon` | Generate a standard 1024x1024 app icon | icon.png |
| `generate_favicon` | Generate a 48x48 web favicon with rounded corners | favicon.png |
| `generate_splash` | Generate a 1024x1024 splash screen icon | splash-icon.png |
| `generate_android_icons` | Generate Android adaptive icon variants | Foreground, background, and monochrome icons |

## Input

All tools accept either:

- **`file_path`** — Path to a local PNG file or Apple Icon Composer `.icon` folder
- **`base64_image`** — Base64-encoded PNG image data

Optional: **`output_dir`** — Where to write generated files (defaults to a temp directory)

## Example Usage

Once configured, just ask your AI assistant:

> "Generate all app icon variants from ./AppIcon.icon"

> "Create a favicon from ./logo.png"

> "Generate Android adaptive icons from my app icon with a blue background"

## Requirements

- Node.js >= 18

## License

MIT
