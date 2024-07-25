import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { cssTools } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    cssTools(),
  ],
})
