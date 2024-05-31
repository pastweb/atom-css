import { plugin as utilityModules} from '../postcss';
import { CSS_LANGS_RE } from './constants';
import type { Plugin } from 'vite';
import { ViteCssUtilityModulesOptions, ModulesMap } from './types';

function viteUtilityModulesPre(): Plugin {
  const importers: Record<string, string> = {};

  return {
    name: 'vite-css-utility-modules-pre',
    enforce: 'pre',
    async resolveId(id, importer, options) {
      if (CSS_LANGS_RE.test(id) && importer) {
        importers[importer] = id;
      }
    },
    async transform(code, id) {
      if (!importers[id]) return;
      console.log(code);
      // if (!CSS_LANGS_RE.test(id)) return;
      // console.log('id:', id);
      // console.log('code:', code, code.length);
      // const result = await postcss([
      //   ,
      // ]).process(code, { from: id, to: id });

      // return {
      //   code: result.css,
      //   // map: result.map
      // };
    }
  };
}

function viteUtilityModulesPost(options: ViteCssUtilityModulesOptions = {}): Plugin {
  return {
    name: 'vite-css-utility-modules-post',
    enforce: 'post',
    
  };
}

export function viteUtilityModules(options: ViteCssUtilityModulesOptions = {}): Plugin {
  const { scopeLength, scopedCSSVariables, mode } = options;

  const modulesMap: ModulesMap = {};

  return {
    name: 'vite-css-utility-modules',
    config(config, { command }) {
      return {
        css: {
          postcss: {
            plugins: [
              utilityModules({
                scopeLength,
                scopedCSSVariables,
                getModules(filePath, modules) {
                  modulesMap[filePath] = modulesMap[filePath] || {};
                  modulesMap[filePath].modules = modules;
                },
                utility: mode ? {
                  mode,
                  output: false,
                  getUtilityModules(filePath, modules) {
                    modulesMap[filePath] = modulesMap[filePath] || {};
                    modulesMap[filePath].utilities = modules;
                  },
                } : false,
              })
            ],
          },
        },
        plugins:[
          viteUtilityModulesPre(),
          viteUtilityModulesPost(),  
        ],
      };
    },
  };
}
