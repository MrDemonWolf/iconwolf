import { generate } from '@mrdemonwolf/iconwolf';
import type { GenerationResult } from '@mrdemonwolf/iconwolf';
import {
  resolveInputPath,
  readFileAsBase64,
  cleanTempDir,
} from '../utils/io.js';
import type { GenerateIconsInput } from '../utils/schemas.js';

export async function handleGenerateIcons(input: GenerateIconsInput) {
  const { inputPath, tempDir } = resolveInputPath(
    input.file_path,
    input.base64_image,
  );

  const outputDir = input.output_dir ?? tempDir + '/output';

  try {
    const variants = input.variants ?? {
      icon: false,
      android: false,
      favicon: false,
      splash: false,
    };

    const results = await generate({
      inputPath,
      outputDir,
      variants,
      bgColor: input.bg_color,
      splashInputPath: input.splash_input_path,
      banner: input.banner,
      silent: true,
    });

    return formatResults(results);
  } finally {
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
