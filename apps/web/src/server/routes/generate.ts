import { Hono } from 'hono';
import { generate } from '@mrdemonwolf/iconwolf';
import { createTempDir, saveUploadedFile, resolveInputPath } from '../utils/temp.js';
import { createSession } from '../utils/sessions.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const generateRoute = new Hono();

generateRoute.post('/generate', async (c) => {
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

    // Save and resolve input
    const savedPath = await saveUploadedFile(imageFile, tempDir);
    const inputPath = await resolveInputPath(savedPath, tempDir);

    // Handle optional splash image
    let splashInputPath: string | undefined;
    const splashFile = formData.get('splashImage') as File | null;
    if (splashFile) {
      const splashSaved = await saveUploadedFile(splashFile, tempDir, 'splash-');
      splashInputPath = await resolveInputPath(splashSaved, tempDir, 'splash');
    }

    // Parse config
    const variants = formData.get('variants');
    const variantConfig = variants ? JSON.parse(variants as string) : {};
    const bgColor = (formData.get('bgColor') as string) || undefined;
    const darkBgColor = (formData.get('darkBgColor') as string) || undefined;
    const bannerRaw = formData.get('banner');
    const bannerConfig = bannerRaw ? JSON.parse(bannerRaw as string) : {};

    // Generate icons
    const results = await generate({
      inputPath,
      outputDir,
      silent: true,
      variants: {
        icon: variantConfig.icon || false,
        android: variantConfig.android || false,
        favicon: variantConfig.favicon || false,
        splash: variantConfig.splash || false,
      },
      bgColor: bgColor || '#FFFFFF',
      darkBgColor,
      banner: bannerConfig.text
        ? { text: bannerConfig.text, color: bannerConfig.color, position: bannerConfig.position }
        : undefined,
      splashInputPath: splashInputPath,
    });

    // Read generated files as base64
    const resultData = await Promise.all(
      results.map(async (r) => {
        const buffer = await fs.readFile(r.filePath);
        return {
          name: path.basename(r.filePath),
          width: r.width,
          height: r.height,
          size: r.size,
          base64: buffer.toString('base64'),
        };
      })
    );

    // Store in session
    const sessionId = crypto.randomUUID();
    createSession(sessionId, resultData);

    // Cleanup temp dir
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;

    return c.json({ sessionId, results: resultData });
  } catch (error) {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    const message = error instanceof Error ? error.message : 'Generation failed';
    return c.json({ error: message }, 500);
  }
});
