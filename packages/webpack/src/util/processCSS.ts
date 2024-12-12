import postcss from 'postcss';
import { atomicCss, Options } from '@pastweb/atomic-css-postcss';

// Utility function to process CSS with the plugin
export async function processCSS (code: string, opts: Options, filePath: string) {
  const result = await postcss([ atomicCss(opts) ]).process(code, { from: filePath });
  return result.css;
};
