import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

function getBaseUrl(req: Request): string {
  const envUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${String(proto).split(',')[0]}://${String(host).split(',')[0]}`.replace(/\/+$/, '');
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      status: 'healthy',
      timestamp: Date.now(),
    });
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const tabs = [
      'home',
      'quran',
      'azkar',
      'tasbih',
      'prayer',
      'qibla',
      'radio',
      'names_of_allah',
      'downloads',
      'more',
      'ad_contact',
    ];
    const today = new Date().toISOString().slice(0, 10);
    const urls = tabs.map((tab) => {
      const loc = tab === 'home' ? `${baseUrl}/` : `${baseUrl}/?tab=${tab}`;
      const priority = tab === 'home' ? '1.0' : '0.8';
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '    <changefreq>daily</changefreq>',
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    });

    res.type('application/xml').send(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        '</urlset>',
      ].join('\n')
    );
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use(async (req: Request, res: Response, next) => {
      try {
        const templatePath = path.join(ROOT_DIR, 'index.html');
        let html = fs.readFileSync(templatePath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(DIST_DIR, { maxAge: '7d' }));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sakina server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
