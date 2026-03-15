import { Hono } from 'hono';
import { getSession } from '../utils/sessions.js';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export const downloadRoute = new Hono();

downloadRoute.get('/download/:sessionId', async (c) => {
  const { sessionId } = c.req.param();
  const session = getSession(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const passthrough = new PassThrough();

  archive.pipe(passthrough);

  for (const result of session.results) {
    const buffer = Buffer.from(result.base64, 'base64');
    archive.append(buffer, { name: result.name });
  }

  await archive.finalize();

  // Collect into buffer for Hono response
  const chunks: Buffer[] = [];
  for await (const chunk of passthrough) {
    chunks.push(chunk as Buffer);
  }
  const zipBuffer = Buffer.concat(chunks);

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="iconwolf-icons.zip"`,
    },
  });
});
