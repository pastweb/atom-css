import { defineConfig } from 'vite'
import { utilityModules } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    utilityModules({
      scope: {
        cssVariables: true,
      },
      modules: true,
      utility: {
//        mode: 'coded',
        mode: 'readable',
        media: true,
      },
    }),
  ],
})
