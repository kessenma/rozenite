/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
  ],
  base: './',
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: false,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        'react-native': resolve(__dirname, 'react-native.ts'),
        'panel': resolve(__dirname, 'src/ui/panel.tsx'),
      },
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
        },
        {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
        },
      ],
      external: ['react', 'react-dom', '@rozenite/plugin-bridge'],
    },
  },
});