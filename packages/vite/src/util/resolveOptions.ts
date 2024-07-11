import { CSS_LANGS_RE } from '../constants';
import type { ResolvedConfig } from 'vite';
import { plugins, AstPlugins } from './getUsedClasses';
import type { CssUtilityOptions, ResolvedCssUtilityOptions, ModulesMap } from '../types';

export function resolveOptions(options: CssUtilityOptions, modulesMap: ModulesMap, config: ResolvedConfig): ResolvedCssUtilityOptions {
  const { mode, css } = config;
  const test = { include: css.modules ? CSS_LANGS_RE : new RegExp(`\\.module${CSS_LANGS_RE.source}`) };

  const _plugins = [ ...plugins, ...options.astPlugins || [] ];
  const astPlugins: AstPlugins = {};

  _plugins.forEach(({ name, ast }) => {
    Object.entries(ast).forEach(([type, fn]) => {
      astPlugins[type] = astPlugins[type] || {};
      astPlugins[type][name] = fn;
    });
  });

  return {
    ...options,
    test,
    getModules(filePath, modules) {
      modulesMap[filePath] = modulesMap[filePath] || {};
      modulesMap[filePath].modules = modules;
    },
    astPlugins,
    ...options.utility ? {
      utility: {
        ...options.utility,
        mode: options.utility.mode ? options.utility.mode : mode === 'development' ? 'readable' : 'coded',
        output: false,
        getUtilityModules(filePath, modules) {
          modulesMap[filePath] = modulesMap[filePath] || {};
          modulesMap[filePath].utilities = modules;
        },
      },
    } : {},
  };
}
