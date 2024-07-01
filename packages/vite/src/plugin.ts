import path from 'node:path';
import postcss from 'postcss';
import { postCssUtlityModules, Options } from '../../postcss';
import { resolveOptions, getModuleData, appendUtilities } from './util';
import { dataToEsm, createFilter } from '@rollup/pluginutils';
import { CSS_LANGS_RE, CLIENT_PUBLIC_PATH, CLASS_NAME_RE } from './constants';
import type { Plugin, ResolvedConfig } from 'vite';
import { ViteCssUtilityModulesOptions, ModulesMap, ImporterData } from './types';

// Utility function to process CSS with the plugin
async function processCSS (input: string, opts: Options, filePath: string) {
  const result = await postcss([postCssUtlityModules(opts)]).process(input, { from: filePath });
  return result.css;
};

export function utilityModules(options: ViteCssUtilityModulesOptions = {}): Plugin[] {
  let importers: Record<string, ImporterData> = {};
  let modulesMap: ModulesMap = {};
  let testFilter: ((id: unknown) => boolean) | '' | null | undefined;
  let opts: Options;
  let config: ResolvedConfig;
  let isHMR: boolean;

  return [
    {
      name: 'vite-plugin-utility-modules-pre',
      enforce: 'pre',
      configResolved(_config) {
        isHMR = _config.command === 'serve' && _config.mode !== 'production';
        config = _config;
      },
      buildStart() {
        // Ensure a new cache for every build (i.e. rebuilding in watch mode)
        importers = {};
        modulesMap = {};
        opts = resolveOptions(options, modulesMap, config);
        const { include, exclude } = opts.test || {};
        testFilter = (include || exclude) && createFilter(include, exclude);
      },
      async resolveId(id, importer, { isEntry }) {
        if (testFilter && testFilter(id)) {
          const resolved = await this.resolve(id, importer);
          
          if (!resolved) return;
          
          const { id: resolvedId } = resolved;
          modulesMap[resolvedId] = { isEntry, importedCss: new Set() };
          
          if (importer) {
            modulesMap[resolvedId].importer = importer;
            importers[importer] = { id: resolvedId, importedCss: new Set() };  
          }
        }
      },
    },
    {
      name: 'vite-plugin-utility-modules',
      async transform(code, id) {
        if (testFilter && !testFilter(id)) return;
        
        const match = code.match(CLASS_NAME_RE);
        
        if (!match) return;

        // use the code parsed from the vite:css-plugin for prePsessors and url resolution
        let newCode = code;
        const classes = Array.from(new Set(match.filter(m => isNaN(parseInt(m.charAt(1))))));
        // remove de scope if present
        classes.forEach(scoped => {
          const unscoped = scoped.replace(/^\._/, '.').replace(/_\w+$/, '');
          newCode = newCode.replace(new RegExp(`\\${scoped}`, 'g'), unscoped);
        });
        
        const css = await processCSS(newCode, opts, id);
        modulesMap[id].css = css;

        return { code: css };
      },
    },
    {
      name: 'vite-plugin-utility-modules-post',
      enforce: 'post',
      async transform(_, id, options) {
        if (testFilter && !testFilter(id)) return;

        const { modules } = modulesMap[id];

        const modulesCode = dataToEsm(modules, { namedExports: true, preferConst: true });

        // server only
        if (config.command === 'serve' && options?.ssr) return modulesCode;

        if (isHMR) {
          let { css, utilities } = modulesMap[id];

          if (utilities) {
            css = `${css}\n${Object.values(utilities).reduce((acc, u) => `${acc}${u}\n`, '')}`;
          }

          const code = [
            `import { updateStyle as __vite__updateStyle, removeStyle as __vite__removeStyle } from ${JSON.stringify(
              path.posix.join(config.base, CLIENT_PUBLIC_PATH),
            )}`,
            `const __vite__id = ${JSON.stringify(id)}`,
            `const __vite__css = ${JSON.stringify(css)}`,
            `__vite__updateStyle(__vite__id, __vite__css)`,
            // css modules exports change on edit so it can't self accept
            `${modulesCode || 'import.meta.hot.accept()'}`,
            `import.meta.hot.prune(() => __vite__removeStyle(__vite__id))`,
          ].join('\n');

          return {
            code,
            // map: null,
            // meta: { vite: { isSelfAccepting: true } },
          };
        }
        
        return { code: modulesCode };
      },
      async renderChunk(_, chunk) {
        const { facadeModuleId, viteMetadata, moduleIds, isEntry } = chunk;
  
        if (facadeModuleId && modulesMap[facadeModuleId]) {
          modulesMap[facadeModuleId].importedCss = viteMetadata?.importedCss || new Set();
        } else if (facadeModuleId && importers[facadeModuleId]) {
          importers[facadeModuleId].importedCss = viteMetadata?.importedCss || new Set();
          importers[facadeModuleId].isEntry = isEntry;
          for (const id of Object.keys(moduleIds)) {
            if (modulesMap[id]) {
              modulesMap[id].importedCss = viteMetadata?.importedCss || new Set();
            }
          }
        }
      },

      async generateBundle(_options, bundle) {
        const dataModules = Object.values(modulesMap);
        for (const [ file, chunk ] of Object.entries(bundle)) {
          const { type, fileName } = chunk;
  
          switch(type) {
            case 'asset':
              const moduleData = getModuleData(dataModules, importers, fileName);
  
              if (moduleData) {
                appendUtilities(dataModules, moduleData, importers, chunk);
              }
            break;
            case 'chunk':
              const { facadeModuleId, code }  = chunk;
              if (facadeModuleId && modulesMap[facadeModuleId] && (!code || code === '\n')) {
                delete bundle[file];
              }
            break;
          }
        }
      },
    },
  ];
}
