import { ResolvedUtilityOptions } from './types';

export const CLASS_NAME_RE = /^\s*(\:global\s*\(\s*)?(\.[a-z\-_][a-z\-_0-9]+)\s*\)?/g;
export const ANIMATION_NAME_RE = /(global\s*\()?[\w-\$]+\)?$/;
export const GLOBAL_ANIMATION_RE = /global\s*\(|\)/g;
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
