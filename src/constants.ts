import { ResolvedUtilityOptions } from './types';

export const CLASS_NAME_RE = /(^|[^\\]):global\(\s*([^)]+)\s*\)|:global\s+\.([\w-\$]+)|\.([\w-\$]+)/g;
export const ANIMATION_NAME_RE = /(global\()?[\w-\$]+\)?$/;
export const GLOBAL_ANIMATION_RE = /global\(|\)/g;

export const DEFAULT_UTILITY_OPTIONS: ResolvedUtilityOptions = {
  mode: 'readable',
  media: false,
  container: false,
  output: true,
};
