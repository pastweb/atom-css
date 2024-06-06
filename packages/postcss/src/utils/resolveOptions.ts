import { DEFAULT_UTILITY_OPTIONS } from '../constants';
import { Options, ResolvedOptions, ResolvedUtilityOptions, ResolvedVariablesOptions } from '../types';

export function resolveOptions(options: Options): ResolvedOptions {
  let key = '';

  switch(typeof options.scopedCSSVariables) {
    case 'boolean':
      key = options.scopedCSSVariables ? '/' : '';
    break;
    case 'string':
      key = options.scopedCSSVariables as string;
    break;
    case 'object':
      key = options.scopedCSSVariables.key || '/';
    break;
  }

  const scopedCSSVariables: ResolvedVariablesOptions = {
    ...typeof options.scopedCSSVariables === 'object' ? options.scopedCSSVariables : {},
    key,
  };

  return {
    scopeLength: options.scopeLength || 8,
    modules: !!options.modules,
    utility: options.utility ? typeof options.utility === 'boolean' ? DEFAULT_UTILITY_OPTIONS : {
      ...DEFAULT_UTILITY_OPTIONS,
      ...options.utility as Partial<ResolvedUtilityOptions>,
    } as ResolvedUtilityOptions: false,
    scopedCSSVariables,
    getModules: options.getModules || (() => {}),
  };
}
