import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { atomCss } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  // build: { minify: false },
  plugins: [
    preact(),
    atomCss(),
  ],
})
