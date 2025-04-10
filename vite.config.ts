import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['obsidian'],
      output: {
        format: 'cjs',
        exports: 'default',
        entryFileNames: '[name].js',
        assetFileNames: 'styles.css',
        name: 'YesterdaysWeatherPlugin',
        // Ensure all code is in a single chunk
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: 'inline',
    minify: 'esbuild',
    // Ensure the output is compatible with Obsidian's plugin system
    target: 'es2018',
    cssCodeSplit: false,
  },
});