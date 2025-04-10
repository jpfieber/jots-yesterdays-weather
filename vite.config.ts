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
                exports: 'default',
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: 'inline',
    },
});