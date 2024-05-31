import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import { viteUtilityModules } from '../../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteUtilityModules({ mode: 'readable' }),
  ],
})
