import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/main.js', // Entry point for your plugin
  output: {
    file: 'main.js', // Output file for Obsidian
    format: 'cjs', // CommonJS format for Obsidian compatibility
  },
  external: ['obsidian'], // Mark 'obsidian' as an external dependency
  plugins: [
    resolve(), // Resolves node_modules imports
    commonjs(), // Converts CommonJS modules to ESM
    json(), // Allows importing JSON files
  ],
};