import {
  generateFavicon,
  validateSourceImage,
  isIconComposerFolder,
  renderIconComposerFolder,
} from 'iconwolf';
import {
  resolveInputPath,
  readFileAsBase64,
  cleanTempDir,
} from '../utils/io.js';
import type { GenerateSingleInput } from '../utils/schemas.js';
import fs from 'node:fs';
import path from 'node:path';

export async function handleGenerateFavicon(input: GenerateSingleInput) {
  const { inputPath, tempDir } = resolveInputPath(
    input.file_path,
    input.base64_image,
  );

  const outputDir = input.output_dir ?? tempDir + '/output';
  let resolvedInput = inputPath;
  let composerCleanup: string | undefined;

  try {
    if (isIconComposerFolder(resolvedInput)) {
      const composed = await renderIconComposerFolder(resolvedInput);
      resolvedInput = composed.composedImagePath;
      composerCleanup = path.dirname(composed.composedImagePath);
    }

    await validateSourceImage(resolvedInput);
    fs.mkdirSync(outputDir, { recursive: true });
    const result = await generateFavicon(resolvedInput, outputDir);
    const base64 = readFileAsBase64(result.filePath);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              file: result.filePath,
              width: result.width,
              height: result.height,
              sizeBytes: result.size,
            },
            null,
            2,
          ),
        },
        {
          type: 'image' as const,
          data: base64,
          mimeType: 'image/png',
        },
      ],
    };
  } finally {
    if (composerCleanup) {
      cleanTempDir(composerCleanup);
    }
    if (!input.file_path) {
      cleanTempDir(tempDir);
    }
  }
}
