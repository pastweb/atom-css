import { resolve, dirname, posix } from 'node:path';
import postcss from 'postcss';
import { postCssTools, Options } from '@pastweb/postcss-tools';
import { resolveOptions, getModuleData, appendUtilities, getUsedClasses, AstPlugins, AstPlugin } from './util';
import { dataToEsm, createFilter } from '@rollup/pluginutils';
import { CLIENT_PUBLIC_PATH, JS_TYPES_RE, FRAMEWORK_TYPE, MODULE_RE } from './constants';
import { transformWithEsbuild, PluginOption, ResolvedConfig, ViteDevServer } from 'vite';
import { CssToolsOptions, ModulesMap, ImporterData } from './types';

// Utility function to process CSS with the plugin
async function processCSS (input: string, opts: Options, filePath: string) {
  const result = await postcss([postCssTools(opts)]).process(input, { from: filePath });
  return result.css;
};

export function cssTools(options: CssToolsOptions = {}): PluginOption {
  const importers: Record<string, ImporterData> = {};
  const modulesMap: ModulesMap = {};
  let testFilter: ((id: unknown) => boolean) | '' | null | undefined;
  let generateScopedName: (name: string, filePath: string, css: string) => string;
  let opts: Options;
  let usedClasses = true;
  let astPlugins: AstPlugin[];
  let resolvedAstPlugins: AstPlugins = {};
  let config: ResolvedConfig;
  let server: ViteDevServer;
  let isHMR: boolean;
  const entryModules = new Set<string>();
  const getUtilitiesCssCode = () => Object.values(Object.values(modulesMap).reduce((acc, { utilities }) => ({ ...acc, ...utilities }), {})).join('\n');
  const updateUtilitiesTag = () => server.ws.send('css-tools:update-utilities-css', getUtilitiesCssCode());

  const plugins: PluginOption = [
    {
      name: 'vite-plugin-css-tools-pre',
      enforce: 'pre',
      config(config) {
        if (config.css?.lightningcss) return;
        
        if (config.css && typeof config.css.modules === 'object' && typeof config.css.modules.generateScopedName === 'function') {
          generateScopedName = config.css.modules.generateScopedName;
        }

        return {
          css: {
            modules: {
              generateScopedName: name => name,
            }
          },
        };
      },
      configResolved(_config) {
        config = _config;
        
        if (config.css?.lightningcss) return;
        
        isHMR = config.command === 'serve' && config.mode !== 'production';

        const {
          astPlugins: _astPlugins,
          usedClasses: _usedClasses,
          ...rest
        } = resolveOptions(options, modulesMap, config, generateScopedName);

        opts = rest;
        astPlugins = _astPlugins;
        usedClasses = _usedClasses || usedClasses;

        _astPlugins.forEach(({ name, ast }) => {
          Object.entries(ast).forEach(([type, fn]) => {
            resolvedAstPlugins[type] = resolvedAstPlugins[type] || {};
            resolvedAstPlugins[type][name] = fn;
          });
        });

        const { include, exclude } = opts.test || {};
        testFilter = (include || exclude) && createFilter(include, exclude);
      },
      configureServer(_server) {
        server = _server;

        if (!opts.utility) return;

        server.ws.on('css-tools:initial-utilities-css', () => updateUtilitiesTag());
      },
      async resolveId(id, importer, { isEntry }) {
        if (config.css?.lightningcss) return;

        if (isHMR && !/node_modules/g.test(id) && importer && /\.html$/.test(importer)) {
          entryModules.add(resolve(dirname(importer), `.${id}`));
        }

        if (testFilter && testFilter(id) && importer) {
          const resolvedId = resolve(dirname(importer), /\.html$/.test(importer) ? `.${id}` : id);
          
          modulesMap[resolvedId] = modulesMap[resolvedId] || {};
          modulesMap[resolvedId].usedClasses = [];
          modulesMap[resolvedId].isEntry = isEntry;
          modulesMap[resolvedId].importedCss = new Set();

          modulesMap[resolvedId].importer = importer;
          importers[importer] = { id: resolvedId, importedCss: new Set() };
        }
      },
    },
    {
      name: 'vite-plugin-css-tools',
      async transform(code, id) {
        if (config.css?.lightningcss) return;

        if (isHMR && opts.utility && entryModules.has(id)) {
          const utilitiesHMR = [
            `if (import.meta.hot) {`,
            `  const style = document.createElement('style');`,
            `  style.id = 'css-tools-utilities';`,
            `  document.head.append(style);`,
            ``,
            `  // Initial CSS injection on server start`,
            `  import.meta.hot.send('css-tools:initial-utilities-css');`,
            ``,
            `  // Dynamic CSS updates on changes`,
            `  import.meta.hot.on('css-tools:update-utilities-css', css => style.textContent = css);`,
            `}`,
          ].join('\n');

          return { code: `${code}\n${utilitiesHMR}`, map: { mappings: '' } };
        }

        if (usedClasses && !/node_modules/.test(id) && (JS_TYPES_RE.test(id) || FRAMEWORK_TYPE.test(id))) {
          const _usedClasses = await getUsedClasses(id, code, astPlugins, resolvedAstPlugins);

          if (!_usedClasses) return null;

          Object.entries(_usedClasses).forEach(([ filePath, classes ]) => {
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
        
        let disableModules = false;
        
        if (!MODULE_RE.test(id) && (typeof config.css.modules !== 'boolean' || !config.css.modules)) {
          disableModules = true;
        }

        // use the code parsed from the vite:css-plugin for prePsessors and url resolution
        const { usedClasses: _usedClasses } = modulesMap[id];
        const css = await processCSS(code, {
          ...opts,
          usedClasses: _usedClasses,
          ...disableModules ? {
            scope: { classNames: false },
            utility: false,
          } : {},
        }, id);
        
        modulesMap[id].css = css;
        const map = this.getCombinedSourcemap();
        
        return { code: css, map };
      },
    },
    {
      name: 'vite-plugin-css-tools-post',
      enforce: 'post',
      async transform(_, id, options) {
        if (config.css?.lightningcss) return;
        if (testFilter && !testFilter(id)) return;

        const { modules, css } = modulesMap[id];

        const modulesCode = dataToEsm(modules, { namedExports: true, preferConst: true });

        // server only
        if (config.command === 'serve' && options?.ssr) return modulesCode;

        if (isHMR) {
          if (opts.utility) updateUtilitiesTag();

          const code = [
            `import { updateStyle as __vite__updateStyle, removeStyle as __vite__removeStyle } from ${JSON.stringify(
              posix.join(config.base, CLIENT_PUBLIC_PATH),
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
        if (config.css?.lightningcss) return;
        
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
        if (config.css?.lightningcss) return;

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
              const { facadeModuleId, code, isEntry, viteMetadata }  = chunk;

              if (isEntry && viteMetadata?.importedCss && viteMetadata?.importedCss.size) {
                const [ cssFileName ] = Array.from(viteMetadata.importedCss);
                const cssChunk = bundle[cssFileName] as any;
                let code = cssChunk.source;
    
                dataModules.forEach(({ utilities }) => {
                  if (!utilities) return;
                  
                  Object.values(utilities).forEach(util => {
                    code = `${code}\n${util}`;
                  });
                });

                if (config.build.minify) {
                  const result = await transformWithEsbuild(code, cssFileName, { loader: 'css', minify: true });
                  code = result.code;
                }

                cssChunk.source = code;
              } else if (facadeModuleId && modulesMap[facadeModuleId] && (!code || code === '\n')) {
                delete bundle[file];
              }
            break;
          }
        }
      },
    },
  ];

  return plugins;
}
