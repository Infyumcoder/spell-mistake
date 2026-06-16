import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // pdfjs-dist ships a worker as an ESM module; let Vite handle it as an asset
  worker: { format: 'es' },
});
