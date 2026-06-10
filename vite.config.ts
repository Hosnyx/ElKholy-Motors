import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

const rawFilePlugin = () => ({
  name: 'raw-file-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/raw-file')) {
        try {
          const url = new URL(req.url, 'http://localhost');
          const filePath = url.searchParams.get('path');
          if (filePath) {
            const absolutePath = path.resolve(process.cwd(), filePath);
            if (fs.existsSync(absolutePath)) {
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end(fs.readFileSync(absolutePath, 'utf-8'));
              return;
            }
          }
        } catch (err) {
          console.error(err);
        }
        res.statusCode = 404;
        res.end('File not found');
        return;
      }
      next();
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [rawFilePlugin(), tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
