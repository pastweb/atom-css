import path from 'node:path';
import postcss from 'postcss';
import { postCssUtlityModules, Options } from '../../postcss';
import { resolveOptions, getModuleData, appendUtilities, getUsedClasses, AstPlugins, AstPlugin } from './util';
import { dataToEsm, createFilter } from '@rollup/pluginutils';
import { CLIENT_PUBLIC_PATH, CLASS_NAME_RE, JS_TYPES_RE, FRAMEWORK_TYPE } from './constants';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { CssUtilityOptions, ModulesMap, ImporterData } from './types';

// Utility function to process CSS with the plugin
async function processCSS (input: string, opts: Options, filePath: string) {
  const result = await postcss([postCssUtlityModules(opts)]).process(input, { from: filePath });
  return result.css;
};

export function utilityModules(options: CssUtilityOptions = {}): Plugin[] {
  let importers: Record<string, ImporterData> = {};
  let modulesMap: ModulesMap = {};
  let testFilter: ((id: unknown) => boolean) | '' | null | undefined;
  let opts: Options;
  let astPlugins: AstPlugin[];
  let resolvedAstPlugins: AstPlugins = {};
  let config: ResolvedConfig;
  let server: ViteDevServer;
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
        const { astPlugins: _astPlugins, ...rest } = resolveOptions(options, modulesMap, config);
        opts = rest;
        astPlugins = _astPlugins;
        _astPlugins.forEach(({ name, ast }) => {
          Object.entries(ast).forEach(([type, fn]) => {
            resolvedAstPlugins[type] = resolvedAstPlugins[type] || {};
            resolvedAstPlugins[type][name] = fn;
          });
        });
        const { include, exclude } = opts.test || {};
        testFilter = (include || exclude) && createFilter(include, exclude);
      },
      async resolveId(id, importer, { isEntry }) {
        if (testFilter && testFilter(id)) {
          const resolved = await this.resolve(id, importer);
          
          if (!resolved) return;
          
          const { id: resolvedId } = resolved;
          modulesMap[resolvedId] = modulesMap[resolvedId] || {};
          modulesMap[resolvedId].isEntry = isEntry;
          modulesMap[resolvedId].importedCss = new Set();
          
          if (importer) {
            modulesMap[resolvedId].importer = importer;
            importers[importer] = { id: resolvedId, importedCss: new Set() };  
          }
        }
      },
      configureServer(_server) { server = _server; },
    },
    {
      name: 'vite-plugin-utility-modules',
      async transform(code, id) {
        if (!/node_modules/.test(id) && (JS_TYPES_RE.test(id) || FRAMEWORK_TYPE.test(id))) {
          const usedClasses = await getUsedClasses(id, code, astPlugins, resolvedAstPlugins);

          if (!usedClasses) return null;

          Object.entries(usedClasses).forEach(([ filePath, classes ]) => {
            modulesMap[filePath] = modulesMap[filePath] || {};

            if (isHMR && modulesMap[filePath].usedClasses && (JSON.stringify(classes) !== JSON.stringify(modulesMap[filePath].usedClasses))) {
              const cssModule = server.moduleGraph.getModuleById(filePath);
              
              if (!cssModule) return;
              
              server.moduleGraph.invalidateModule(cssModule);
              server.ws.send({
                type: 'full-reload',
                path: filePath,
              });
            }

            modulesMap[filePath].usedClasses = classes;
          });

          return null;
        } else if (testFilter && !testFilter(id)) return;
        const match = code.match(CLASS_NAME_RE);
        
        if (!match) return;

        // use the code parsed from the vite:css-plugin for prePsessors and url resolution
        let newCode = code;
        const classes = Array.from(new Set(match.filter(m => isNaN(parseInt(m.charAt(1))))));
        // remove de scope if present
        classes.forEach(scoped => {
          // TODO: change the regexp to match just 1 _ at the scope beginning
          const unscoped = scoped.replace(/^\._/, '.').replace(/_\w+$/, '');
          newCode = newCode.replace(new RegExp(`\\${scoped}`, 'g'), unscoped);
        });
        
        const { usedClasses } = modulesMap[id];
        const css = await processCSS(newCode, { ...opts, usedClasses }, id);
        modulesMap[id].css = css;
        const map = this.getCombinedSourcemap();
        return { code: css, map };
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

          return { code, map: { mappings: '' } };
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
