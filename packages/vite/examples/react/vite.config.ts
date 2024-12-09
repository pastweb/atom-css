import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { atomCss } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    atomCss(),
  ],
})
