import { defineConfig, type Plugin } from 'vite';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Имена папок public/mods/weapons с data.json (по алфавиту). */
function weaponFolders(publicDir: string): string[] {
  const folder = join(publicDir, 'mods', 'weapons');
  return existsSync(folder) ? readdirSync(folder, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(folder, entry.name, 'data.json')))
    .map(entry => entry.name).sort() : [];
}

/**
 * Страница не может прочитать список папок, поэтому mods/index.json даёт этот модуль: на сервере разработки — по текущим папкам,
 * при сборке — статический файл по папкам на момент сборки (на статическом хостинге его можно править вручную).
 */
const modIndex = (): Plugin => {
  let publicDir = 'public';
  return {
    name: 'mod-index',
    configResolved(config) { publicDir = config.publicDir; },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.split('?')[0].endsWith('/mods/index.json')) return next();
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify({ weapons: weaponFolders(server.config.publicDir) }));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'mods/index.json', source: `${JSON.stringify({ weapons: weaponFolders(publicDir) })}\n` });
    },
  };
};

export default defineConfig({
  base: './',
  plugins: [modIndex()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 1600 },
});
