import { defineConfig } from 'vite';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { join, normalize, resolve } from 'node:path';

const DATA_DIR = resolve('data');

function adminApiPlugin() {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/admin-api/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405).end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { file, content } = JSON.parse(body);
            // Security: only allow writes inside data/
            const target = normalize(resolve(file));
            if (!target.startsWith(DATA_DIR + '/') || !target.endsWith('.json')) {
              res.writeHead(403).end(JSON.stringify({ ok: false, error: 'Forbidden path' }));
              return;
            }
            writeFileSync(target, JSON.stringify(content, null, 2), 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
      });

      server.middlewares.use('/admin-api/build', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405).end('Method Not Allowed');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        const child = exec('node build.mjs');
        child.stdout.on('data', chunk => res.write(chunk));
        child.stderr.on('data', chunk => res.write(chunk));
        child.on('close', code => {
          res.end(`\n[exit ${code}]`);
        });
      });
    },
  };
}

function seoPreviewPlugin() {
  const DIST = resolve('dist');

  function runBuild() {
    return new Promise(resolve => {
      exec('node build.mjs', (err, stdout, stderr) => {
        if (err) console.error('[seo-preview] build error:', stderr);
        else console.log('[seo-preview] rebuilt:', stdout.split('\n')[0]);
        resolve();
      });
    });
  }

  return {
    name: 'seo-preview',
    apply: 'serve',
    async buildStart() {
      await runBuild();
    },
    configureServer(server) {
      // Watch data/ and rebuild on change
      server.watcher.add(resolve('data'));
      server.watcher.on('change', async path => {
        if (path.startsWith(resolve('data')) && path.endsWith('.json')) {
          console.log('[seo-preview] data changed, rebuilding…');
          await runBuild();
        }
      });

      // Serve dist/ HTML for SEO paths (anything not matched by Vite assets)
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0].replace(/\/+$/, '') || '/';
        // Skip Vite internals, assets, admin, and admin-api
        if (url.startsWith('/@') || url.startsWith('/assets') ||
            url.startsWith('/admin') || url.startsWith('/admin-api') ||
            url.startsWith('/src') || url.startsWith('/node_modules')) {
          return next();
        }
        // Try dist/{url}/index.html
        const candidate = join(DIST, url, 'index.html');
        if (existsSync(candidate)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(readFileSync(candidate, 'utf8'));
        }
        // Try dist/{url} directly (e.g. sitemap.xml, robots.txt)
        const direct = join(DIST, url);
        if (existsSync(direct) && !direct.endsWith('/')) {
          return next(); // let Vite's static handler serve it
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [adminApiPlugin(), seoPreviewPlugin()],
});
