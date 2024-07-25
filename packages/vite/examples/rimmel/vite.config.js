import { defineConfig } from 'vite';
import { cssTools } from '../../dist/index.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [ cssTools({
    astPlugins: [
      {
        name: 'rimmel',
        import: {
          source: /^rimmel$/,
          specifier: /^rml$/,
        },
        ast: {
          ['TaggedTemplateExpression'](node, specifiers) {
            const specifier = specifiers.has(node.tag.name) ? node.tag.name : '';
    
            if (!specifier) return;
    
            return node;
          },
        },
      },
    ],
  }) ],
})
