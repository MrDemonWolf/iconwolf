import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { generateRoute } from './routes/generate.js';
import { previewRoute } from './routes/preview.js';
import { downloadRoute } from './routes/download.js';
import { healthRoute } from './routes/health.js';
import { cleanupExpiredSessions } from './utils/sessions.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = new Hono();

// API routes
app.route('/api', healthRoute);
app.route('/api', generateRoute);
app.route('/api', previewRoute);
app.route('/api', downloadRoute);

// Serve static frontend in production
const clientDir = path.resolve(__dirname, '../client');
app.use('/*', serveStatic({ root: clientDir }));

// SPA fallback
app.get('*', serveStatic({ root: clientDir, path: '/index.html' }));

// Cleanup expired sessions every minute
setInterval(cleanupExpiredSessions, 60_000);

const port = parseInt(process.env.PORT || '3001', 10);
console.log(`iconwolf web server listening on port ${port}`);
serve({ fetch: app.fetch, port });
