import { defineConfig } from 'vite';
import { atomCss } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [ atomCss({
    astPlugins: [
      {
        name: 'rimmel',
        import: {
          source: /^rimmel$/,
          specifier: /^rml$/,
        },
        ast: {
          ['TaggedTemplateExpression'](node, specifiers) {
            if (!specifiers.has(node.tag.name)) return;
            return node;
          },
        },
      },
    ],
  }) ],
})
