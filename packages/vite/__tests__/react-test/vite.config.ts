import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import react from '@vitejs/plugin-react';
import { utilityModules } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Inspect(),
    react(),
    utilityModules({
      scope: {
        cssVariables: true,
      },
      modules: true,
      utility: {
        // mode: 'semireadable',
        media: true,
      },
    }),
  ],
})
