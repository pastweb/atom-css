import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cssTools } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssTools(),
  ],
})
