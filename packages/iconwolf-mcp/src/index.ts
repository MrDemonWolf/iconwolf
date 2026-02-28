#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  generateIconsSchema,
  generateSingleSchema,
  generateAndroidSchema,
  generateIconComposerSchema,
} from './utils/schemas.js';
import { handleGenerateIcons } from './tools/generate-icons.js';
import { handleGenerateIcon } from './tools/generate-icon.js';
import { handleGenerateFavicon } from './tools/generate-favicon.js';
import { handleGenerateSplash } from './tools/generate-splash.js';
import { handleGenerateAndroid } from './tools/generate-android.js';
import { handleGenerateIconComposer } from './tools/generate-icon-composer.js';
import type {
  GenerateIconsInput,
  GenerateSingleInput,
  GenerateAndroidInput,
  GenerateIconComposerInput,
} from './utils/schemas.js';

const server = new McpServer({
  name: 'iconwolf',
  version: '0.1.0',
});

function errorResponse(error: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    ],
    isError: true,
  };
}

function validateInput(input: { file_path?: string; base64_image?: string }) {
  if (!input.file_path && !input.base64_image) {
    throw new Error('Either file_path or base64_image must be provided');
  }
}

server.tool(
  'generate_icons',
  'Generate all icon variants (icon, favicon, splash, Android adaptive) from a single source image. Mirrors the iconwolf CLI default behavior.',
  generateIconsSchema.shape,
  async (input) => {
    try {
      validateInput(input);
      return await handleGenerateIcons(input as GenerateIconsInput);
    } catch (error) {
      return errorResponse(error);
    }
  },
);

server.tool(
  'generate_icon',
  'Generate a standard 1024x1024 icon.png from a source image.',
  generateSingleSchema.shape,
  async (input) => {
    try {
      validateInput(input);
      return await handleGenerateIcon(input as GenerateSingleInput);
    } catch (error) {
      return errorResponse(error);
    }
  },
);

server.tool(
  'generate_favicon',
  'Generate a 48x48 favicon.png with rounded corners from a source image.',
  generateSingleSchema.shape,
  async (input) => {
    try {
      validateInput(input);
      return await handleGenerateFavicon(input as GenerateSingleInput);
    } catch (error) {
      return errorResponse(error);
    }
  },
);

server.tool(
  'generate_splash',
  'Generate a 1024x1024 splash-icon.png from a source image.',
  generateSingleSchema.shape,
  async (input) => {
    try {
      validateInput(input);
      return await handleGenerateSplash(input as GenerateSingleInput);
    } catch (error) {
      return errorResponse(error);
    }
  },
);

server.tool(
  'generate_android_icons',
  'Generate Android adaptive icon variants (foreground, background, monochrome) from a source image.',
  generateAndroidSchema.shape,
  async (input) => {
    try {
      validateInput(input);
      return await handleGenerateAndroid(input as GenerateAndroidInput);
    } catch (error) {
      return errorResponse(error);
    }
  },
);

server.tool(
  'generate_icon_composer',
  'Generate an Apple Icon Composer .icon folder from a source PNG. Supports light and dark mode background colors for iOS 18+ dark/tinted icon variants.',
  generateIconComposerSchema.shape,
  async (input) => {
    try {
      validateInput(input);
      return await handleGenerateIconComposer(
        input as GenerateIconComposerInput,
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
