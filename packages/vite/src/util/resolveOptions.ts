import { CSS_LANGS_RE } from '../constants';
import type { ResolvedConfig } from 'vite';
import { plugins } from './getUsedClasses';
import type { CssToolsOptions, ResolvedCssUtilityOptions, ModulesMap } from '../types';

export function resolveOptions(options: CssToolsOptions, modulesMap: ModulesMap, config: ResolvedConfig, generateScopedName?: (name: string, filePath: string, css: string) => string): ResolvedCssUtilityOptions {
  const { mode } = config;
  const test = { include: CSS_LANGS_RE };
  const astPlugins = [ ...plugins, ...options.astPlugins || [] ];
  const { scope } = options;
  const classNames = generateScopedName;

  return {
    usedClasses: true,
    ...options,
    ...generateScopedName ? {
      scope: {
        ...typeof scope === 'number' ? { length: scope, classNames } : scope ? { ...scope, classNames } : { classNames },
      },
    } : {},
    test,
    getModules(filePath, modules) {
      modulesMap[filePath] = modulesMap[filePath] || {};
      modulesMap[filePath].modules = modules;
    },
    astPlugins,
    ...typeof options.utility === 'boolean' && !options.utility ? { utility: false } :
      typeof options.utility === 'object' ?
     {
      utility: {
        ...options.utility,
        mode: options.utility.mode ? options.utility.mode : mode === 'development' ? 'semireadable' : 'encoded',
        output: false,
        getUtilityModules(filePath, modules) {
          modulesMap[filePath] = modulesMap[filePath] || {};
          modulesMap[filePath].utilities = modules;
        },
      },
    } : {
      utility: {
        mode: mode === 'development' ? 'semireadable' : 'encoded',
        output: false,
        getUtilityModules(filePath, modules) {
          modulesMap[filePath] = modulesMap[filePath] || {};
          modulesMap[filePath].utilities = modules;
        },
      },
    },
  };
}
