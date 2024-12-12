export const PLUGIN_NAME = 'AtomicCss';
export const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
export const MODULE_RE = new RegExp(`\\.module${CSS_LANGS_RE.source}`);
export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
export const FRAMEWORK_TYPE = /\.(vue|svelte)$/;

export const DEFAULT_ENTRY_RE = new RegExp(`index${JS_TYPES_RE.source}`);
