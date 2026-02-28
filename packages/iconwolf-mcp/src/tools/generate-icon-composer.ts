import {
  createIconComposerFolder,
  validateSourceImage,
} from '@mrdemonwolf/iconwolf';
import {
  resolveInputPath,
  readFileAsBase64,
  cleanTempDir,
} from '../utils/io.js';
import type { GenerateIconComposerInput } from '../utils/schemas.js';
import fs from 'node:fs';
import path from 'node:path';

export async function handleGenerateIconComposer(
  input: GenerateIconComposerInput,
) {
  const { inputPath, tempDir } = resolveInputPath(
    input.file_path,
    input.base64_image,
  );

  const outputDir = input.output_dir;

  try {
    await validateSourceImage(inputPath);

    const result = await createIconComposerFolder(inputPath, outputDir, {
      bgColor: input.bg_color,
      darkBgColor: input.dark_bg_color,
      banner: input.banner,
    });

    // Read the foreground image as base64 for the response
    const foregroundPath = path.join(outputDir, 'Assets', 'foreground.png');
    const base64 = readFileAsBase64(foregroundPath);

    // Read the manifest for the response
    const manifestPath = path.join(outputDir, 'icon.json');
    const manifest = fs.readFileSync(manifestPath, 'utf-8');

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              folder: result.filePath,
              width: result.width,
              height: result.height,
              sizeBytes: result.size,
              manifest: JSON.parse(manifest),
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
    if (!input.file_path) {
      cleanTempDir(tempDir);
    }
  }
}
