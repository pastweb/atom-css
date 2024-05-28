import { DEFAULT_UTILITY_OPTIONS } from '../constants';
import { Options, ResolvedOptions, ResolvedUtilityOptions } from '../types';

export function resolveOptions(options: Options): ResolvedOptions {
  return {
    baseUrl: options.baseUrl || '/',
    scopeLength: options.scopeLength || 8,
    modules: !!options.modules,
    utility: options.utility ? typeof options.utility === 'boolean' ? DEFAULT_UTILITY_OPTIONS : {
      ...DEFAULT_UTILITY_OPTIONS,
      ...options.utility as Partial<ResolvedUtilityOptions>,
    } as ResolvedUtilityOptions: false,
    scopedCSSVariables: !!options.scopedCSSVariables,
    getModules: () => {},
  };
}
