import {
  generateAndroidIcons,
  validateSourceImage,
  isIconComposerFolder,
  renderIconComposerFolder,
} from '@mrdemonwolf/iconwolf';
import type { GenerationResult } from '@mrdemonwolf/iconwolf';
import {
  resolveInputPath,
  readFileAsBase64,
  cleanTempDir,
} from '../utils/io.js';
import type { GenerateAndroidInput } from '../utils/schemas.js';
import fs from 'node:fs';
import path from 'node:path';

export async function handleGenerateAndroid(input: GenerateAndroidInput) {
  const { inputPath, tempDir } = resolveInputPath(
    input.file_path,
    input.base64_image,
  );

  const outputDir = input.output_dir ?? tempDir + '/output';
  let resolvedInput = inputPath;
  let composerCleanup: string | undefined;
  let bgColor = input.bg_color;

  try {
    if (isIconComposerFolder(resolvedInput)) {
      const composed = await renderIconComposerFolder(resolvedInput);
      resolvedInput = composed.composedImagePath;
      composerCleanup = path.dirname(composed.composedImagePath);
      if (bgColor === '#FFFFFF') {
        bgColor = composed.extractedBgColor;
      }
    }

    await validateSourceImage(resolvedInput);
    fs.mkdirSync(outputDir, { recursive: true });
    const results = await generateAndroidIcons(
      resolvedInput,
      outputDir,
      bgColor,
      { includeBackground: input.include_background },
    );

    return formatResults(results);
  } finally {
    if (composerCleanup) {
      cleanTempDir(composerCleanup);
    }
    if (!input.file_path) {
      cleanTempDir(tempDir);
    }
  }
}

function formatResults(results: GenerationResult[]) {
  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
  > = [];

  const metadata = results.map((r) => ({
    file: r.filePath,
    width: r.width,
    height: r.height,
    sizeBytes: r.size,
  }));

  content.push({
    type: 'text' as const,
    text: JSON.stringify(
      {
        success: true,
        files: metadata,
        totalFiles: results.length,
      },
      null,
      2,
    ),
  });

  for (const result of results) {
    try {
      const base64 = readFileAsBase64(result.filePath);
      content.push({
        type: 'image' as const,
        data: base64,
        mimeType: 'image/png',
      });
    } catch {
      // File may have been cleaned up; skip image content
    }
  }

  return { content };
}
