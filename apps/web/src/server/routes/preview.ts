import { Hono } from 'hono';
import { generate } from '@mrdemonwolf/iconwolf';
import {
  createTempDir,
  saveUploadedFile,
  resolveInputPath,
} from '../utils/temp.js';
import fs from 'fs/promises';
import path from 'path';

export const previewRoute = new Hono();

previewRoute.post('/preview', async (c) => {
  let tempDir: string | undefined;

  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return c.json({ error: 'No image file provided' }, 400);
    }

    tempDir = await createTempDir();
    const outputDir = path.join(tempDir, 'output');
    await fs.mkdir(outputDir);

    const savedPath = await saveUploadedFile(imageFile, tempDir);
    const inputPath = await resolveInputPath(savedPath, tempDir);

    const bgColor = (formData.get('bgColor') as string) || undefined;

    const results = await generate({
      inputPath,
      outputDir,
      silent: true,
      variants: { icon: true, android: false, favicon: false, splash: false },
      bgColor: bgColor || '#FFFFFF',
    });

    const result = results[0];
    const buffer = await fs.readFile(result.filePath);

    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;

    return c.json({
      name: path.basename(result.filePath),
      width: result.width,
      height: result.height,
      size: result.size,
      base64: buffer.toString('base64'),
    });
  } catch (error) {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    const message = error instanceof Error ? error.message : 'Preview failed';
    return c.json({ error: message }, 500);
  }
});
