import { CSS_LANGS_RE } from '../constants';
import type { Options } from "../../../postcss";
import type { ViteCssUtilityModulesOptions, ModulesMap } from '../types';

export function resolveOptions(options: ViteCssUtilityModulesOptions, modulesMap: ModulesMap, mode: string): Options {
  const test = options.test || { include: new RegExp(`\\.modules${CSS_LANGS_RE.source}`) };

  return {
    ...options,
    test,
    getModules(filePath, modules) {
      modulesMap[filePath] = modulesMap[filePath] || {};
      modulesMap[filePath].modules = modules;
    },
    ...options.utility ? {
      utility: {
        ...options.utility,
        mode: options.utility.mode || mode === 'development' ? 'readable' : 'coded',
        output: false,
        getUtilityModules(filePath, modules) {
          modulesMap[filePath] = modulesMap[filePath] || {};
          modulesMap[filePath].utilities = modules;
        },
      },
    } : {},
  };
}
