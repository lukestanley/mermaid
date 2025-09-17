/* eslint-disable no-console */
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 4173);
const rootDir = resolve(fileURLToPath(new URL('../', import.meta.url)));
const publicDir = resolve(rootDir);
const imgDir = resolve(rootDir, 'img/manual-positioning');

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

await mkdir(imgDir, { recursive: true });

const handleRequest = async ([request, response]: Parameters<
  Parameters<typeof createServer>[0]
>) => {
  try {
    if (!request.url) {
      response.statusCode = 400;
      response.end('Bad request');
      return;
    }

    const url = new URL(request.url, 'http://localhost');

    if (request.method === 'POST' && url.pathname === '/save') {
      console.log('Received save request');
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        request.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk));
        });
        request.on('end', resolve);
        request.on('error', reject);
      });
      const payload = Buffer.concat(chunks).toString('utf8');
      const data = JSON.parse(payload) as {
        examples?: { id: string; beforeSvg: string; afterSvg: string }[];
      };
      if (!data.examples || !Array.isArray(data.examples)) {
        response.statusCode = 400;
        response.end('Invalid payload');
        return;
      }

      await Promise.all(
        data.examples.map(async (example) => {
          const beforePath = join(imgDir, `${example.id}-before.svg`);
          const afterPath = join(imgDir, `${example.id}-after.svg`);
          await writeFile(beforePath, example.beforeSvg, 'utf8');
          await writeFile(afterPath, example.afterSvg, 'utf8');
          console.log(`Saved SVGs for ${example.id}`);
        })
      );

      response.statusCode = 204;
      response.end();
      return;
    }

    const pathname = normalize(
      url.pathname === '/' ? '/demos/manual-positioning/index.html' : url.pathname
    );
    const filePath = resolve(publicDir, pathname.replace(/^\/+/, ''));

    if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    const ext = extname(filePath);
    const type = contentTypes[ext] ?? 'application/octet-stream';
    const body = await readFile(filePath);
    response.statusCode = 200;
    response.setHeader('Content-Type', type);
    response.end(body);
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end('Internal server error');
  }
};

const server = createServer((req, res) => {
  handleRequest([req, res]).catch((error) => {
    console.error(error);
    res.statusCode = 500;
    res.end('Internal server error');
  });
});

server.listen(PORT, () => {
  console.log(`Manual positioning server running at http://localhost:${PORT}/`);
});
