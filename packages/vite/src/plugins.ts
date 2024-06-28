import postcss from 'postcss';
import { postCssUtlityModules, Options } from '../../postcss';
import { resolveOptions, getModuleData, appendUtilities } from './util';
import { dataToEsm, createFilter } from '@rollup/pluginutils';
import type { Plugin } from 'vite';
import { ViteCssUtilityModulesOptions, ModulesMap, ModuleData, ImporterData } from './types';

let importers: Record<string, ImporterData> = {};
let modulesMap: ModulesMap = {};
let testFilter: ((id: unknown) => boolean) | '' | null | undefined;

// Utility function to process CSS with the plugin
async function processCSS (input: string, opts: Options, filePath: string) {
  const result = await postcss([postCssUtlityModules(opts)]).process(input, { from: filePath });
  return result.css;
};

export function utilityModulesPre(options: ViteCssUtilityModulesOptions = {}): Plugin {
  let opts: Options;
  let mode: string = 'development';

  return {
    name: 'vite-plugin-utility-modules-pre',
    enforce: 'pre',
    config(_config, { command, mode: _mode }) {
      mode = _mode;
    },
    buildStart() {
      // Ensure a new cache for every build (i.e. rebuilding in watch mode)
      importers = {};
      modulesMap = {};
      opts = resolveOptions(options, modulesMap, mode);
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
    async transform(code, id) {
      if (testFilter && !testFilter(id)) return;
      const css = await processCSS(code, opts, id);
      // modulesMap[id].css = css;
      
      return { code: css, map: { mappings: '' } };
    },
  };
}

export function utilityModulesPost(): Plugin {
  return {
    name: 'vite-plugin-utility-modules-post',
    enforce: 'post',
    async transform(_, id) {
      if (testFilter && !testFilter(id)) return;

      const { modules, isEntry } = modulesMap[id];
      if (isEntry) return;
      
      const processedCode = dataToEsm(modules, { namedExports: true, preferConst: true });
      return { code: processedCode, map: { mappings: '' } };
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

      return null;  
    },
    async generateBundle(_options, bundle) {
      const dataModules = Object.values(modulesMap);

      for (const chunk of Object.values(bundle)) {
        const { type, fileName } = chunk;

        if (type !== 'asset') return;

        const moduleData = getModuleData(dataModules, importers, fileName);

        if (moduleData) {
          appendUtilities(dataModules, moduleData, importers, chunk);
        }
      }
    },
  };
}
