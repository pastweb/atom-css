import { CSS_LANGS_RE } from '../constants';
import type { ResolvedConfig } from 'vite';
import { plugins } from './getUsedClasses';
import type { CssUtilityOptions, ResolvedCssUtilityOptions, ModulesMap } from '../types';

export function resolveOptions(options: CssUtilityOptions, modulesMap: ModulesMap, config: ResolvedConfig): ResolvedCssUtilityOptions {
  const { mode, css } = config;
  const test = { include: css.modules ? CSS_LANGS_RE : new RegExp(`\\.module${CSS_LANGS_RE.source}`) };
  const astPlugins = [ ...plugins, ...options.astPlugins || [] ];

  return {
    ...options,
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
        mode: options.utility.mode ? options.utility.mode : mode === 'development' ? 'readable' : 'encoded',
        output: false,
        getUtilityModules(filePath, modules) {
          modulesMap[filePath] = modulesMap[filePath] || {};
          modulesMap[filePath].utilities = modules;
        },
      },
    } : {
      utility: {
        mode: mode === 'development' ? 'readable' : 'encoded',
        output: false,
        getUtilityModules(filePath, modules) {
          modulesMap[filePath] = modulesMap[filePath] || {};
          modulesMap[filePath].utilities = modules;
        },
      },
    },
  };
}
