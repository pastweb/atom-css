import { ResolvedUtilityOptions } from './types';
export const CLASS_NAME_RE = /(^|[^\\]):global\(\s*([^)]+)\s*\)|\.([\w-]+)/g;
export const ANIMATION_NAME_RE = /(global\()?[\w-\$]+\)?$/;
export const GLOBAL_ANIMATION_RE = /global\(|\)/g;
export const VENDORS_RE = /^--(webkit|moz|ms|o)-/;
export const AT_RULES = new Set(['media', 'container', 'scope', 'layer', 'supports']);

export const DEFAULT_UTILITY_OPTIONS: ResolvedUtilityOptions = {
  mode: 'readable',
  atRules: {
    container: true,
    layer: true,
    media: true,
    scope: true,
    supports: true,
  },
  output: true,
};
